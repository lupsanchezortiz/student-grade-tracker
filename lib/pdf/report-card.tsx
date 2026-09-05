import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { normalizeLayout } from "@/lib/data/layout";
import type {
  CourseDetail,
  Grade,
  Locale,
  Student,
  Term,
} from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1f2a44",
  },
  kicker: {
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#5c6b86",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: "Times-Bold",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: "#3d4a63",
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#c9d0dc",
    marginBottom: 16,
  },
  metaCell: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#c9d0dc",
  },
  metaLabel: {
    fontSize: 8,
    color: "#5c6b86",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#eef2f7",
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  itemRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#d5dbe6",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  itemName: { flex: 1 },
  itemMark: { width: 90, textAlign: "right", fontFamily: "Helvetica-Bold" },
  comment: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 10,
    lineHeight: 1.4,
  },
  legend: {
    marginTop: 16,
    fontSize: 8,
    color: "#5c6b86",
  },
  sign: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signLine: {
    width: 200,
    borderTopWidth: 1,
    borderTopColor: "#1f2a44",
    paddingTop: 4,
    fontSize: 8,
    color: "#5c6b86",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#7a8699",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export type ReportCardInput = {
  locale: Locale;
  course: CourseDetail;
  term: Term;
  student: Student;
  grades: Grade[];
};

const copy = {
  en: {
    district: "Northside Unified School District",
    card: "Progress report",
    student: "Student",
    grade: "Grade",
    school: "School",
    term: "Term",
    year: "Year",
    id: "Student ID",
    comments: "Comments",
    teacher: "Teacher signature",
    parent: "Parent / guardian signature",
    generated: "Generated from the Northside gradebook",
  },
  es: {
    district: "Distrito Escolar Unificado de Northside",
    card: "Informe de progreso",
    student: "Estudiante",
    grade: "Grado",
    school: "Escuela",
    term: "Periodo",
    year: "Año",
    id: "Número de estudiante",
    comments: "Comentarios",
    teacher: "Firma del maestro",
    parent: "Firma del padre / tutor",
    generated: "Generado desde el libro de calificaciones de Northside",
  },
};

function t<K extends keyof typeof copy.en>(locale: Locale, key: K) {
  return copy[locale][key];
}

export function ReportCardDocument({ cards }: { cards: ReportCardInput[] }) {
  return (
    <Document>
      {cards.map((card) => (
        <ReportCardPage key={`${card.student.id}-${card.term.id}`} card={card} />
      ))}
    </Document>
  );
}

function ReportCardPage({ card }: { card: ReportCardInput }) {
  const { locale, course, term, student, grades } = card;
  const marks = new Map(course.template.marks.map((m) => [m.id, m]));
  const byItem = new Map(grades.map((g) => [g.templateItemId, g]));
  const termName = locale === "es" ? term.nameEs : term.nameEn;
  const gradeName = locale === "es" ? course.gradeLevel.nameEs : course.gradeLevel.nameEn;
  const layout = normalizeLayout(course.template.layout);
  const headerCells = [
    layout.headerFields.student
      ? { label: t(locale, "student"), value: `${student.firstName} ${student.lastName}` }
      : null,
    layout.headerFields.id ? { label: t(locale, "id"), value: student.studentNumber } : null,
    layout.headerFields.grade ? { label: t(locale, "grade"), value: gradeName } : null,
    layout.headerFields.school ? { label: t(locale, "school"), value: course.site.name } : null,
  ].filter((c): c is { label: string; value: string } => Boolean(c));
  const markWidth = layout.table.markColumnWidth === "wide" ? 150 : 90;
  const rowPad = layout.table.density === "spacious" ? 8 : 5;
  const comments = course.template.sections.flatMap((s) =>
    s.items.filter((i) => i.itemType === "comment"),
  );

  function markText(itemId: string) {
    const grade = byItem.get(itemId);
    const mark = grade?.markId ? marks.get(grade.markId) : null;
    if (!mark) return "—";
    const code = layout.table.showMarkCode ? mark.code : "";
    const label = layout.table.showMarkLabel
      ? locale === "es"
        ? mark.labelEs
        : mark.labelEn
      : "";
    return [code, label].filter(Boolean).join("  ") || "—";
  }

  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.kicker}>{t(locale, "district")}</Text>
      <Text style={styles.title}>{t(locale, "card")}</Text>
      <Text style={styles.subtitle}>
        {locale === "es" ? course.template.name : course.template.name}
      </Text>
      {headerCells.length > 0 ? (
        <View style={styles.metaRow}>
          {headerCells.map((cell, i) => (
            <View
              key={cell.label}
              style={[
                styles.metaCell,
                i === headerCells.length - 1 ? { borderRightWidth: 0 } : {},
              ]}
            >
              <Text style={styles.metaLabel}>{cell.label}</Text>
              <Text style={styles.metaValue}>{cell.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={{ flexDirection: "row", marginBottom: 8, gap: 16 }}>
        {layout.headerFields.term ? (
          <Text>
            {t(locale, "term")}: {termName}
          </Text>
        ) : null}
        {layout.headerFields.year ? (
          <Text>
            {t(locale, "year")}: {course.year.name}
          </Text>
        ) : null}
        {layout.headerFields.course ? <Text>{course.name}</Text> : null}
      </View>

      {course.template.sections.map((section) => {
        const markItems = section.items.filter((i) => i.itemType === "mark");
        const commentItems = section.items.filter((i) => i.itemType === "comment");
        const showComments =
          layout.commentsPlacement === "inline" && commentItems.length > 0;
        if (markItems.length === 0 && !showComments) return null;
        return (
          <View key={section.id} wrap={false}>
            <Text style={styles.sectionTitle}>
              {locale === "es" ? section.titleEs : section.titleEn}
            </Text>
            {markItems.map((item) => (
              <View
                key={item.id}
                style={[styles.itemRow, { paddingVertical: rowPad }]}
              >
                <Text style={styles.itemName}>
                  {locale === "es" ? item.titleEs : item.titleEn}
                </Text>
                <Text style={[styles.itemMark, { width: markWidth }]}>
                  {markText(item.id)}
                </Text>
              </View>
            ))}
            {showComments
              ? commentItems.map((item) => {
                  const grade = byItem.get(item.id);
                  const text = grade?.comment || "—";
                  return (
                    <View key={item.id}>
                      <Text style={styles.itemRow}>
                        <Text style={styles.itemName}>
                          {locale === "es" ? item.titleEs : item.titleEn}
                        </Text>
                      </Text>
                      <Text style={styles.comment}>
                        {item.maxChars ? text.slice(0, item.maxChars) : text}
                      </Text>
                    </View>
                  );
                })
              : null}
          </View>
        );
      })}

      {layout.commentsPlacement === "bottom"
        ? comments.map((item) => {
            const grade = byItem.get(item.id);
            const text = grade?.comment || "—";
            return (
              <View key={item.id}>
                <Text style={styles.sectionTitle}>
                  {locale === "es" ? item.titleEs : item.titleEn}
                </Text>
                <Text style={styles.comment}>
                  {item.maxChars ? text.slice(0, item.maxChars) : text}
                </Text>
              </View>
            );
          })
        : null}

      <Text style={styles.legend}>
        {course.template.marks
          .map(
            (m) => `${m.code} = ${locale === "es" ? m.labelEs : m.labelEn}`,
          )
          .join("   ·   ")}
      </Text>

      <View style={styles.sign}>
        <Text style={styles.signLine}>{t(locale, "teacher")}</Text>
        <Text style={styles.signLine}>{t(locale, "parent")}</Text>
      </View>

      <View style={styles.footer} fixed>
        <Text>{course.site.name}</Text>
        <Text>{t(locale, "generated")}</Text>
      </View>
    </Page>
  );
}
