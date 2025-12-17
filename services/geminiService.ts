import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Helper to convert File to Base64
const fileToPart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type || 'application/pdf', // Default to PDF if type missing, though browser usually detects
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.OBJECT,
      properties: {
        processedCount: { type: Type.INTEGER },
        duplicateCount: { type: Type.INTEGER },
        shortlistedCount: { type: Type.INTEGER },
        rejectedCount: { type: Type.INTEGER },
        recommendedCutoff: { type: Type.INTEGER },
      },
      required: ["processedCount", "duplicateCount", "shortlistedCount", "rejectedCount", "recommendedCutoff"]
    },
    candidates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          email: { type: Type.STRING },
          score: { type: Type.INTEGER },
          category: { type: Type.STRING, enum: ["Strongly Shortlisted", "Shortlisted", "Backup", "Rejected"] },
          filename: { type: Type.STRING },
          evaluation: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
              redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
              startupFit: { type: Type.STRING },
              interviewQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              emailSubject: { type: Type.STRING },
              emailBody: { type: Type.STRING },
            },
            required: ["summary", "strengths", "gaps", "redFlags", "startupFit", "interviewQuestions", "emailSubject", "emailBody"]
          }
        },
        required: ["id", "name", "email", "score", "category", "filename", "evaluation"]
      }
    }
  },
  required: ["summary", "candidates"]
};

export const analyzeResumes = async (
  roleTitle: string,
  jobDescription: string,
  startupContext: string,
  files: File[]
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Persona and Task Definition
  const systemInstruction = `
    You are an expert startup hiring manager and recruitment strategist.
    Your role is to help early-stage, resource-constrained startups process job applications.
    
    Context:
    - Company Type: Early-stage / Bootstrapped Startup
    - Hiring Urgency: High
    - Bias Awareness: Prioritize skills, potential, and real-world ability over pedigree.
    
    Responsibilities:
    1. Analyze the Job Description and Startup Context.
    2. Process the provided resumes (PDFs/Text).
    3. Detect duplicate resumes (same person).
    4. Extract Candidate Name and Email Address from the resume. If email is missing, return an empty string.
    5. Score each candidate (0-100%) based on skill match and startup fit (ownership, adaptability, speed of learning).
    6. Categorize candidates: Strongly Shortlisted, Shortlisted, Backup, Rejected.
    7. Generate insights: Strengths, Gaps, Red Flags.
    8. Create 3-5 specific interview questions.
    9. Draft the email content based on the Category strictly using the templates below.

    EMAIL GENERATION RULES:
    You must generate the 'emailSubject' and 'emailBody' fields using the exact templates below.
    Replace [Candidate Name] with the candidate's actual name.
    Replace [Job Role] with the analyzed Role Title.
    The Company Name is "ManiTechWebSolutions".

    TEMPLATE A (For categories: Strongly Shortlisted, Shortlisted, Backup):
    Subject: Shortlisted for [Job Role] – ManiTechWebSolutions
    Body:
    Hi [Candidate Name],

    Thank you for applying to the [Job Role] position at ManiTechWebSolutions.

    After reviewing your profile, we are pleased to inform you that your application has been shortlisted. We were impressed by your skills and experience relevant to this role.

    As the next step in our hiring process, we would like you to proceed with a short assignment / technical discussion. Further details regarding this step will be shared with you shortly.

    We appreciate the time and effort you put into your application and look forward to connecting with you.

    Best of luck!

    Warm regards,
    Hiring Team
    ManiTechWebSolutions

    TEMPLATE B (For category: Rejected):
    Subject: Update on Your Application – ManiTechWebSolutions
    Body:
    Hi [Candidate Name],

    Thank you for taking the time to apply for the [Job Role] position at ManiTechWebSolutions and for your interest in being part of our team.

    After careful consideration, we regret to inform you that your profile does not match our current requirements for this role.

    We truly appreciate your interest and effort, and we encourage you to apply for future opportunities with us that align with your skills and experience.

    We wish you all the very best in your career journey.

    Kind regards,
    Hiring Team
    ManiTechWebSolutions

    Constraints:
    - Do NOT penalize for lack of brand-name companies.
    - Focus on transferable skills.
    - Be realistic.
  `;

  const promptText = `
    Role Title: ${roleTitle}
    
    Job Description:
    ${jobDescription}
    
    Startup Context:
    ${startupContext}
    
    Analyze the attached resume files. Map the filename to the analysis.
  `;

  // Process files
  const fileParts = await Promise.all(files.map(file => fileToPart(file)));

  // Add filenames to the prompt to help the model map files to candidates
  const fileListPrompt = `\nAttached Files:\n${files.map((f, i) => `${i + 1}. ${f.name}`).join('\n')}`;

  const contents = [
    {
      role: 'user',
      parts: [
        { text: promptText + fileListPrompt },
        ...fileParts // Corrected: Spread fileParts directly (which contain { inlineData: ... }) instead of mapping to inlineData
      ]
    }
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.4, // Lower temperature for more consistent analytical results
      }
    });

    const resultJson = JSON.parse(response.text || "{}");
    return resultJson as AnalysisResult;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze resumes. Please check your API key and file formats.");
  }
};