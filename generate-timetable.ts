// src/ai/flows/generate-timetable.ts
'use server';

/**
 * @fileOverview Generates a timetable based on user-provided course information.
 *
 * - generateTimetable - A function that generates a timetable.
 * - GenerateTimetableInput - The input type for the generateTimetable function.
 * - GenerateTimetableOutput - The return type for the generateTimetable function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Updated Input schema to include classesPerDay
const GenerateTimetableInputSchema = z.object({
  workingDays: z.number().int().positive().describe('The number of working days in a week.'),
  classesPerDay: z.number().int().positive().describe('The number of teaching periods/classes per day (excluding breaks).'),
  subjects: z
    .array(z.string())
    .min(1)
    .describe('The names of the subjects to include in the timetable.'),
  teachersPerSubject: z
    .array(z.number().int().nonnegative())
    .describe(
      'The number of teachers available for each subject, corresponding to the subjects array.'
    ),
  otherConstraints: z
    .string()
    .optional()
    .describe('Any other constraints to consider. E.g., specific time slots, teacher preferences, required breaks like "Lunch after period 3".'),
});

export type GenerateTimetableInput = z.infer<typeof GenerateTimetableInputSchema>;

// Output schema remains the same
const GenerateTimetableOutputSchema = z.object({
  days: z.array(z.string()).describe('Array of working day names (e.g., ["Monday", "Tuesday", ...]). The length should match workingDays input.'),
  periods: z.array(z.string()).describe('Array of period names or numbers for a day, including any specified breaks (e.g., ["Period 1", "Period 2", "Lunch", "Period 3", ...]). The total number of periods (including breaks) might exceed classesPerDay.'),
  schedule: z.array(z.array(z.string().nullable())).describe('A 2D array representing the timetable grid. schedule[periodIndex][dayIndex] contains the subject and assigned teacher (e.g., "Math - Mr. Smith") or event (e.g., "Lunch") for that slot, or null if the slot is empty/free. The outer array corresponds to periods, and the inner array corresponds to days.')
});

export type GenerateTimetableOutput = z.infer<typeof GenerateTimetableOutputSchema>;

export async function generateTimetable(input: GenerateTimetableInput): Promise<GenerateTimetableOutput> {
  // Add validation within the function if needed, though Zod handles basic types
  if (input.subjects.length !== input.teachersPerSubject.length) {
    throw new Error("Mismatch between the number of subjects and teacher counts.");
  }
  return generateTimetableFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTimetablePrompt',
  input: {
    schema: GenerateTimetableInputSchema, // Use the updated input schema
  },
  output: {
    schema: GenerateTimetableOutputSchema, // Use the output schema
  },
  prompt: `You are a timetable generation expert. Generate an optimal timetable based on the following information. Your goal is to satisfy all constraints, distribute workload evenly, and avoid clashes (e.g., assigning the same teacher to two classes simultaneously).

Inputs:
- Number of Working Days: {{{workingDays}}}
- Number of Classes/Periods per Day: {{{classesPerDay}}} (This is the target number of teaching periods, excluding breaks)
- Subjects: {{#each subjects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Teachers per Subject (corresponding to subjects array): {{#each teachersPerSubject}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Other Constraints: {{{otherConstraints}}} (Pay close attention to requested breaks like Lunch, Assembly, etc.)

Instructions:
1.  Determine the total number of periods per day. Start with the specified 'classesPerDay'. If 'otherConstraints' mention specific breaks (e.g., "Lunch break after period 3", "Assembly at 10 AM"), add those as separate periods. If no breaks are specified, assume a standard structure with {{{classesPerDay}}} teaching periods plus potentially one mid-day break (like Lunch).
2.  Generate names for the working days (e.g., "Monday", "Tuesday", ... up to the 'workingDays' count). The number of day names MUST exactly match the 'workingDays' input.
3.  Generate names for all periods, including teaching slots (e.g., "Period 1", "Period 2", ...) and any specified breaks (e.g., "Lunch", "Break"). The sequence should be logical (e.g., Period 1, Period 2, Period 3, Lunch, Period 4...).
4.  Create the schedule grid. Assign subjects and available teachers to the teaching slots (day, period). Distribute subjects as evenly as possible across the week. Ensure no teacher is double-booked. Place specified breaks (from 'otherConstraints') in the correct slots. Adhere strictly to all 'otherConstraints'.
5.  Format the output strictly as a JSON object matching the defined output schema:
    {
      "days": ["Day 1 Name", "Day 2 Name", ...], // Array length MUST equal 'workingDays'.
      "periods": ["Period 1 Name", "Break Name", "Period 2 Name", ...], // Array containing names for all time slots in a day.
      "schedule": [ // The main timetable grid. MUST be a 2D array.
        // Row 0 (corresponds to periods[0])
        [ "Class/Event for periods[0], days[0]", "Class/Event for periods[0], days[1]", ... ],
        // Row 1 (corresponds to periods[1])
        [ "Class/Event for periods[1], days[0]", "Class/Event for periods[1], days[1]", ... ],
        ...
        // Row N (corresponds to periods[N]) where N = periods.length - 1
      ]
    }
    - CRITICAL: The 'schedule' array MUST be an array of arrays (a 2D array).
    - CRITICAL: The number of rows in 'schedule' MUST EXACTLY MATCH the number of elements in the 'periods' array (i.e., \`schedule.length\` must equal \`periods.length\`).
    - CRITICAL: The number of columns in EACH row of 'schedule' MUST EXACTLY MATCH the number of elements in the 'days' array (i.e., \`schedule[i].length\` must equal \`days.length\` for all \`i\`).
    - Each cell \`schedule[periodIndex][dayIndex]\` must contain a string describing the class (e.g., "Subject - Teacher Name"), event (e.g., "Lunch"), or be \`null\` if the slot is free/unassigned.
    - Ensure the final output is valid JSON adhering precisely to this structure and these dimension rules.`,
});


const generateTimetableFlow = ai.defineFlow<
  typeof GenerateTimetableInputSchema,
  typeof GenerateTimetableOutputSchema
>(
  {
    name: 'generateTimetableFlow',
    inputSchema: GenerateTimetableInputSchema,
    outputSchema: GenerateTimetableOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error('AI failed to generate timetable data.');
    }
    // Basic validation of the structure dimensions
    if (!output.days || !output.periods || !output.schedule) {
         throw new Error('AI output error: Missing days, periods, or schedule in the output.');
    }
    if (output.schedule.length !== output.periods.length) {
      throw new Error(`AI output error: Schedule rows (${output.schedule.length}) do not match number of periods (${output.periods.length}). Periods: ${output.periods.join(', ')}`);
    }
    if (output.schedule.length > 0 && output.schedule.some(row => !Array.isArray(row) || row.length !== output.days.length)) {
       const firstInvalidRow = output.schedule.find(row => !Array.isArray(row) || row.length !== output.days.length);
       const invalidRowLength = Array.isArray(firstInvalidRow) ? firstInvalidRow.length : 'not an array';
       throw new Error(`AI output error: At least one schedule row's column count (${invalidRowLength}) does not match number of days (${output.days.length}). Days: ${output.days.join(', ')}`);
    }
    // Check if all rows have the same number of columns, matching days.length (more robust)
    for (let i = 0; i < output.schedule.length; i++) {
        if (!Array.isArray(output.schedule[i])) {
             throw new Error(`AI output error: Schedule row at index ${i} is not an array.`);
        }
        if (output.schedule[i].length !== output.days.length) {
             throw new Error(`AI output error: Schedule row at index ${i} has ${output.schedule[i].length} columns, but expected ${output.days.length} (number of days).`);
        }
    }

    return output;
  }
);
