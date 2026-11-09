import api from './api';

export const cvService = {
  async uploadCv(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/cvs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async submitManualText(text) {
    const res = await api.post('/cvs/manual-text', { text });
    return res.data;
  },

  async getMyCv() {
    const res = await api.get('/cvs/my-cv');
    return res.data;
  },

  async getProfile() {
    const res = await api.get('/candidates/profile');
    return res.data;
  },

  async updateProfileSkills(payload) {
    const res = await api.put('/candidates/profile/skills', payload);
    return res.data;
  },
};
