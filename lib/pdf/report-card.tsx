import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  BODY_PT,
  isDarkHex,
  layoutFooter,
  layoutTitle,
  mixHex,
  normalizeLayout,
  PDF_CONTENT_WIDTH,
  TITLE_PT,
} from "@/lib/data/layout";
import type {
  CourseDetail,
  Grade,
  Locale,
  Student,
  TemplateLayout,
  Term,
} from "@/lib/types";

function buildStyles(layout: TemplateLayout) {
  const { colors, type, table } = layout;
  const titleSize = TITLE_PT[type.titleSize];
  const bodySize = BODY_PT[type.bodySize];
  const muted = mixHex(colors.ink, colors.page, 0.42);
  const bandFg = isDarkHex(colors.band) ? "#ffffff" : colors.ink;
  const markWidth = Math.round(PDF_CONTENT_WIDTH * (1 - table.criterionWidth / 100));
  const rowPad = table.density === "spacious" ? 8 : 5;

  return {
    markWidth,
    rowPad,
    styles: StyleSheet.create({
      page: {
        paddingTop: 36,
        paddingBottom: 40,
        paddingHorizontal: 40,
        fontSize: bodySize,
        fontFamily: "Helvetica",
        color: colors.ink,
        backgroundColor: colors.page,
      },
      kicker: {
        fontSize: Math.max(8, bodySize - 1),
        letterSpacing: 1.2,
        textTransform: "uppercase",
        color: muted,
        marginBottom: 4,
      },
      title: {
        fontSize: titleSize,
        fontFamily: "Times-Bold",
        marginBottom: 2,
        color: colors.ink,
      },
      titleRule: {
        width: 72,
        height: 3,
        backgroundColor: colors.accent,
        marginTop: 4,
        marginBottom: 10,
      },
      subtitle: {
        fontSize: bodySize,
        color: muted,
        marginBottom: 14,
      },
      metaRow: {
        flexDirection: "row",
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16,
      },
      metaCell: {
        flex: 1,
        padding: 8,
        borderRightWidth: 1,
        borderRightColor: colors.border,
      },
      metaLabel: {
        fontSize: Math.max(7, bodySize - 2),
        color: muted,
        marginBottom: 2,
        textTransform: "uppercase",
      },
      metaValue: {
        fontSize: bodySize,
        fontFamily: "Helvetica-Bold",
        color: colors.ink,
      },
      sectionTitle: {
        fontSize: bodySize,
        fontFamily: "Helvetica-Bold",
        backgroundColor: colors.band,
        color: bandFg,
        paddingVertical: 5,
        paddingHorizontal: 8,
        marginTop: 8,
      },
      tableWrap: table.showOuterBorder
        ? {
            borderWidth: 1,
            borderColor: colors.border,
            borderTopWidth: 0,
          }
        : {},
      itemRow: {
        flexDirection: "row",
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
        paddingVertical: 5,
        paddingHorizontal: 8,
      },
      itemName: { flexGrow: 1, flexShrink: 1, fontSize: bodySize },
      itemMark: {
        width: markWidth,
        textAlign: "right",
        fontFamily: "Helvetica-Bold",
        fontSize: bodySize,
      },
      comment: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        fontSize: bodySize,
        lineHeight: 1.4,
        color: colors.ink,
      },
      legend: {
        marginTop: 16,
        fontSize: Math.max(7, bodySize - 2),
        color: muted,
      },
      sign: {
        marginTop: 28,
        flexDirection: "row",
        justifyContent: "space-between",
      },
      signLine: {
        width: 200,
        borderTopWidth: 1,
        borderTopColor: colors.accent,
        paddingTop: 4,
        fontSize: Math.max(7, bodySize - 2),
        color: muted,
      },
      footer: {
        position: "absolute",
        bottom: 24,
        left: 40,
        right: 40,
        fontSize: Math.max(7, bodySize - 2),
        color: muted,
        flexDirection: "row",
        justifyContent: "space-between",
      },
    }),
  };
}

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
    student: "Student",
    grade: "Grade",
    school: "School",
    term: "Term",
    year: "Year",
    id: "Student ID",
    comments: "Comments",
    teacher: "Teacher signature",
    parent: "Parent / guardian signature",
  },
  es: {
    district: "Distrito Escolar Unificado de Northside",
    student: "Estudiante",
    grade: "Grado",
    school: "Escuela",
    term: "Periodo",
    year: "Año",
    id: "Número de estudiante",
    comments: "Comentarios",
    teacher: "Firma del maestro",
    parent: "Firma del padre / tutor",
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
  const { styles, markWidth, rowPad } = buildStyles(layout);
  const headerCells = [
    layout.headerFields.student
      ? { label: t(locale, "student"), value: `${student.firstName} ${student.lastName}` }
      : null,
    layout.headerFields.id ? { label: t(locale, "id"), value: student.studentNumber } : null,
    layout.headerFields.grade ? { label: t(locale, "grade"), value: gradeName } : null,
    layout.headerFields.school ? { label: t(locale, "school"), value: course.site.name } : null,
  ].filter((c): c is { label: string; value: string } => Boolean(c));
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
      <Text style={styles.title}>{layoutTitle(layout, locale)}</Text>
      <View style={styles.titleRule} />
      <Text style={styles.subtitle}>
        {course.template.name}
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
            <View style={styles.tableWrap}>
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
            </View>
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
        <Text>{layoutFooter(layout, locale)}</Text>
      </View>
    </Page>
  );
}
