const axios = require('axios');

const AI_BASE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const AI_API_KEY = process.env.AI_SERVICE_API_KEY || '';

const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 45000,
  headers: {
    'X-API-Key': AI_API_KEY,
  },
});

/**
 * Extract readable text from uploaded document (PDF or DOCX).
 * @param {Buffer} fileBuffer
 * @param {string} originalFilename
 * @returns {Promise<string>} extracted text
 */
const extractDocumentText = async (fileBuffer, originalFilename) => {
  try {
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'application/octet-stream' });
    formData.append('file', blob, originalFilename);

    const response = await aiClient.post('/api/v1/extract/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data && response.data.success) {
      return response.data.extracted_text;
    }
    throw new Error(response.data?.message || 'Failed to extract text from document');
  } catch (error) {
    if (error.response?.data?.detail) {
      const err = new Error(error.response.data.detail);
      err.statusCode = error.response.status;
      throw err;
    }
    if (error.code === 'ECONNREFUSED') {
      const err = new Error('AI microservice is currently unreachable. Please ensure the Python service is running on port 8000.');
      err.statusCode = 503;
      throw err;
    }
    throw error;
  }
};

/**
 * Extract skills from CV text using Mistral / Taxonomy.
 * @param {string} text
 * @param {string} candidateId
 * @returns {Promise<Array>} list of ExtractedSkill objects
 */
const extractCvSkills = async (text, candidateId = null) => {
  try {
    const response = await aiClient.post('/api/v1/extract/cv', {
      text,
      candidate_id: candidateId ? candidateId.toString() : null,
    });

    if (response.data && response.data.success) {
      return response.data.skills || [];
    }
    return [];
  } catch (error) {
    if (error.response?.data?.detail) {
      const err = new Error(error.response.data.detail);
      err.statusCode = error.response.status;
      throw err;
    }
    if (error.code === 'ECONNREFUSED') {
      const err = new Error('AI microservice is currently unreachable. Please ensure the Python service is running on port 8000.');
      err.statusCode = 503;
      throw err;
    }
    throw error;
  }
};

/**
 * Extract required and preferred skills from a job description.
 * @param {string} title
 * @param {string} description
 * @param {string} responsibilities
 * @param {string} jobId
 * @returns {Promise<{ requiredSkills: Array, preferredSkills: Array }>}
 */
const extractJobSkills = async (title, description, responsibilities = '', jobId = null) => {
  try {
    const response = await aiClient.post('/api/v1/extract/job', {
      title,
      description,
      responsibilities,
      job_id: jobId ? jobId.toString() : null,
    });

    if (response.data && response.data.success) {
      return {
        requiredSkills: response.data.required_skills || [],
        preferredSkills: response.data.preferred_skills || [],
      };
    }
    return { requiredSkills: [], preferredSkills: [] };
  } catch (error) {
    if (error.response?.data?.detail) {
      const err = new Error(error.response.data.detail);
      err.statusCode = error.response.status;
      throw err;
    }
    if (error.code === 'ECONNREFUSED') {
      const err = new Error('AI microservice is currently unreachable.');
      err.statusCode = 503;
      throw err;
    }
    throw error;
  }
};

/**
 * Generate semantic embeddings for a list of texts.
 * @param {Array<string>} texts
 * @returns {Promise<Array<Array<number>>>}
 */
const generateEmbeddings = async (texts) => {
  try {
    const response = await aiClient.post('/api/v1/embeddings', { texts });
    return response.data.embeddings || [];
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      const err = new Error('AI microservice is currently unreachable.');
      err.statusCode = 503;
      throw err;
    }
    throw error;
  }
};

/**
 * Compute candidate-job match score and gap analysis.
 */
const calculateMatch = async (matchPayload) => {
  try {
    const response = await aiClient.post('/api/v1/match', matchPayload);
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      const err = new Error('AI microservice is currently unreachable.');
      err.statusCode = 503;
      throw err;
    }
    throw error;
  }
};

module.exports = {
  extractDocumentText,
  extractCvSkills,
  extractJobSkills,
  generateEmbeddings,
  calculateMatch,
};
