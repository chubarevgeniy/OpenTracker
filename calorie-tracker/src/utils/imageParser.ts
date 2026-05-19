import { createWorker } from 'tesseract.js';
import { format } from 'date-fns';

export async function parseSummaryImage(file: File): Promise<{ date: string; calories: number; carbs: number; protein: number; fat: number } | null> {
 const worker = await createWorker('eng');
 try {
 const ret = await worker.recognize(file);
 const text = ret.data.text;
 console.log("Parsed text from Tesseract:\n", text);

 let parsedDate = format(new Date(), 'yyyy-MM-dd');
 const dateMatch = text.match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*(\d{1,2})\/(\d{1,2})/i);
 if (dateMatch) {
 const currentYear = new Date().getFullYear();
 const month = parseInt(dateMatch[1], 10);
 const day = parseInt(dateMatch[2], 10);
 parsedDate = `${currentYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
 }

 let calories = 0;
 const calMatch = text.match(/([\d,]+)\s+[\d,]+\s+[\d,]+\s*Eaten/im) ||
 text.match(/([\d,]+).*?Eaten/i) ||
 text.match(/(?:Summary.*?)([\d,]+)/is);

 if (calMatch) {
 calories = parseInt(calMatch[1].replace(/,/g, ''), 10);
 }

 let carbs = 0, protein = 0, fat = 0;
 const macroMatch = text.match(/(\d+)\s*\/\s*\d+.*?(\d+)\s*\/\s*\d+.*?(\d+)\s*\/\s*\d+/);
 if (macroMatch) {
 carbs = parseInt(macroMatch[1], 10);
 protein = parseInt(macroMatch[2], 10);
 fat = parseInt(macroMatch[3], 10);
 }

 return {
 date: parsedDate,
 calories,
 carbs,
 protein,
 fat
 };
 } catch (error) {
 console.error("Tesseract parsing error:", error);
 return null;
 } finally {
 await worker.terminate();
 }
}
