// Google Generative AI for AI Assistance
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_GENAI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

/**
 * Initialize Google Generative AI
 */
function initializeAI(): GoogleGenerativeAI {
  if (!API_KEY) {
    throw new Error('GOOGLE_GENAI_API_KEY is not configured');
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(API_KEY);
  }
  return genAI;
}

/**
 * Generate AI response for customer support
 */
export async function generateSupportResponse(
  userMessage: string,
  context?: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const ai = initializeAI();
    const model = ai.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a helpful customer support assistant for HouseHelp, a household services platform in Rwanda. 
    
Context: ${context || 'General support inquiry'}

User message: ${userMessage}

Provide a helpful, professional, and concise response. Be empathetic and solution-oriented. If you don't know the answer, suggest contacting human support.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return {
      success: true,
      response: text,
    };
  } catch (error: any) {
    console.error('AI generation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate AI response',
    };
  }
}

/**
 * Analyze worker profile and suggest improvements
 */
export async function analyzeWorkerProfile(profile: {
  full_name: string;
  skills?: string[];
  experience?: string;
  bio?: string;
}): Promise<{ success: boolean; suggestions?: string[]; score?: number; error?: string }> {
  try {
    const ai = initializeAI();
    const model = ai.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Analyze this worker profile for a household services platform and provide improvement suggestions:

Name: ${profile.full_name}
Skills: ${profile.skills?.join(', ') || 'Not specified'}
Experience: ${profile.experience || 'Not specified'}
Bio: ${profile.bio || 'Not specified'}

Provide:
1. A completeness score (0-100)
2. 3-5 specific suggestions for improvement
3. Focus on professionalism, clarity, and attractiveness to potential clients

Format your response as JSON:
{
  "score": <number>,
  "suggestions": ["suggestion 1", "suggestion 2", ...]
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        score: parsed.score,
        suggestions: parsed.suggestions,
      };
    }

    return {
      success: false,
      error: 'Failed to parse AI response',
    };
  } catch (error: any) {
    console.error('Profile analysis error:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze profile',
    };
  }
}

/**
 * Generate job description based on service type
 */
export async function generateJobDescription(
  serviceType: string,
  requirements?: string[]
): Promise<{ success: boolean; description?: string; error?: string }> {
  try {
    const ai = initializeAI();
    const model = ai.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Generate a professional job description for a household service:

Service Type: ${serviceType}
Additional Requirements: ${requirements?.join(', ') || 'None'}

Create a clear, professional job description that includes:
1. Overview of the service
2. Key responsibilities
3. Expected outcomes
4. Any special requirements

Keep it concise (2-3 paragraphs) and professional.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return {
      success: true,
      description: text,
    };
  } catch (error: any) {
    console.error('Job description generation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate job description',
    };
  }
}

/**
 * Analyze and categorize a behavior report
 */
export async function analyzeReport(
  reportDescription: string
): Promise<{ 
  success: boolean; 
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  requiresIsangeEscalation?: boolean;
  summary?: string;
  error?: string;
}> {
  try {
    const ai = initializeAI();
    const model = ai.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Analyze this behavior report from a household services platform:

Report: ${reportDescription}

Provide:
1. Severity level: low, medium, high, or critical
2. Category: harassment, theft, misconduct, safety, quality, or other
3. Whether it requires escalation to Isange (Rwanda's gender-based violence response system)
4. A brief summary (1-2 sentences)

Format as JSON:
{
  "severity": "<severity>",
  "category": "<category>",
  "requiresIsangeEscalation": <boolean>,
  "summary": "<summary>"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        severity: parsed.severity,
        category: parsed.category,
        requiresIsangeEscalation: parsed.requiresIsangeEscalation,
        summary: parsed.summary,
      };
    }

    return {
      success: false,
      error: 'Failed to parse AI response',
    };
  } catch (error: any) {
    console.error('Report analysis error:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze report',
    };
  }
}

/**
 * Generate training content suggestions
 */
export async function generateTrainingContent(
  topic: string,
  targetAudience: 'workers' | 'households'
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const ai = initializeAI();
    const model = ai.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Generate training content for ${targetAudience} on a household services platform:

Topic: ${topic}
Target Audience: ${targetAudience}

Create educational content that includes:
1. Introduction
2. Key concepts (3-5 points)
3. Best practices
4. Common mistakes to avoid
5. Summary

Keep it practical, clear, and culturally appropriate for Rwanda.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return {
      success: true,
      content: text,
    };
  } catch (error: any) {
    console.error('Training content generation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate training content',
    };
  }
}

/**
 * Translate text to Kinyarwanda (if supported)
 */
export async function translateToKinyarwanda(
  text: string
): Promise<{ success: boolean; translation?: string; error?: string }> {
  try {
    const ai = initializeAI();
    const model = ai.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Translate the following English text to Kinyarwanda:

${text}

Provide only the translation, no explanations.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const translation = response.text();

    return {
      success: true,
      translation,
    };
  } catch (error: any) {
    console.error('Translation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to translate text',
    };
  }
}

/**
 * Generate smart recommendations for households
 */
export async function generateRecommendations(
  householdPreferences: {
    services_used?: string[];
    budget?: string;
    frequency?: string;
    special_needs?: string[];
  }
): Promise<{ success: boolean; recommendations?: string[]; error?: string }> {
  try {
    const ai = initializeAI();
    const model = ai.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Generate personalized service recommendations for a household:

Previous Services: ${householdPreferences.services_used?.join(', ') || 'None'}
Budget: ${householdPreferences.budget || 'Not specified'}
Frequency: ${householdPreferences.frequency || 'Not specified'}
Special Needs: ${householdPreferences.special_needs?.join(', ') || 'None'}

Provide 3-5 specific service recommendations with brief explanations.

Format as JSON array:
["recommendation 1", "recommendation 2", ...]`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Try to parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        recommendations: parsed,
      };
    }

    return {
      success: false,
      error: 'Failed to parse AI response',
    };
  } catch (error: any) {
    console.error('Recommendations generation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate recommendations',
    };
  }
}
