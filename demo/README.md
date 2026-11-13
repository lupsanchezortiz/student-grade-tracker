# Demo Academy Sample Data

This directory contains sample CSV files for **Demo Academy**, the demo school created by the seed script. These files can be used to demonstrate the CSV import functionality of the application during live presentations.

## Files

- **`students.csv`** - 30 students across grades 3, 4, and 5
- **`staff.csv`** - 5 staff members (1 admin, 4 teachers)
- **`courses.csv`** - 6 courses (homeroom sections)
- **`enrollments.csv`** - Student enrollments in courses
- **`grades.csv`** - Sample grades for demonstration

## Usage

These CSV files match the data created by the seed script and follow the same format as the import templates in the application. You can use them to demonstrate:

1. **Import validation** - Show how the app validates CSV format and data
2. **Data updates** - Import the same file twice to show idempotent updates
3. **Error handling** - Modify a file to introduce errors and show error messages
4. **Bilingual data** - Students and grades include English/Spanish language settings

## Note

All names and data in these files are entirely fictional and created for demonstration purposes only. Student numbers follow the pattern `DEMO####` to clearly identify them as demo data.

## Related

See the main repository README for information about:
- Running the seed script (`npm run demo:seed`)
- Resetting demo data (`npm run demo:reset`)
- Required environment variables
- CSV import functionality in the application
