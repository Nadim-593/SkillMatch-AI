const PDFDocument = require('pdfkit');

/**
 * Generate a PDF buffer for a candidate-job match report.
 * @param {Object} data - { candidate, job, matchResult, learningResources }
 * @returns {Promise<Buffer>}
 */
const generateMatchPdf = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const { candidate, job, matchResult, learningResources = [] } = data;

      // Header
      doc.fillColor('#2563eb').fontSize(22).font('Helvetica-Bold').text('SkillMatch AI', 40, 40);
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text('Job–Candidate Match & Skill Gap Analysis Report', 40, 66);
      doc.text(`Generated: ${new Date().toLocaleDateString()} | Report ID: ${matchResult._id}`, 40, 78);

      doc.moveTo(40, 95).lineTo(555, 95).strokeColor('#e2e8f0').stroke();

      // Candidate & Job Info Box
      let y = 110;
      doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('Match Overview', 40, y);
      y += 20;

      doc.fontSize(10).font('Helvetica');
      doc.fillColor('#475569').text('Candidate: ', 40, y, { continued: true });
      doc.fillColor('#0f172a').font('Helvetica-Bold').text(candidate?.name || 'Candidate', { continued: true });
      doc.fillColor('#64748b').font('Helvetica').text(` (${candidate?.email || ''})`);
      y += 16;

      doc.fillColor('#475569').text('Target Role: ', 40, y, { continued: true });
      doc.fillColor('#0f172a').font('Helvetica-Bold').text(job?.title || 'Job Position', { continued: true });
      doc.fillColor('#64748b').font('Helvetica').text(` at ${job?.company || 'Company'}`);
      y += 25;

      // Score Display Cards
      const overall = Math.round(matchResult.overallScore || 0);
      const overlap = Math.round(matchResult.skillOverlapScore || 0);
      const semantic = Math.round(matchResult.semanticSimilarityScore || 0);

      // Box 1 - Overall
      doc.rect(40, y, 160, 55).fillAndStroke('#eff6ff', '#bfdbfe');
      doc.fillColor('#1d4ed8').fontSize(9).font('Helvetica-Bold').text('OVERALL FIT SCORE', 50, y + 10);
      doc.fillColor('#1e40af').fontSize(20).text(`${overall} / 100`, 50, y + 24);

      // Box 2 - Skill Overlap
      doc.rect(210, y, 160, 55).fillAndStroke('#f0fdf4', '#bbf7d0');
      doc.fillColor('#15803d').fontSize(9).font('Helvetica-Bold').text('SKILL OVERLAP (60%)', 220, y + 10);
      doc.fillColor('#166534').fontSize(20).text(`${overlap} %`, 220, y + 24);

      // Box 3 - Semantic Similarity
      doc.rect(380, y, 175, 55).fillAndStroke('#faf5ff', '#e9d5ff');
      doc.fillColor('#7e22ce').fontSize(9).font('Helvetica-Bold').text('SEMANTIC SIMILARITY (40%)', 390, y + 10);
      doc.fillColor('#6b21a8').fontSize(20).text(`${semantic} %`, 390, y + 24);

      y += 75;

      // Explanation
      if (matchResult.explanation) {
        doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Summary Assessment', 40, y);
        y += 16;
        doc.fillColor('#334155').fontSize(9).font('Helvetica').text(matchResult.explanation, 40, y, { width: 515 });
        y += doc.heightOfString(matchResult.explanation, { width: 515 }) + 15;
      }

      // Matched Skills Section
      const matched = matchResult.matchedSkills || [];
      doc.fillColor('#166534').fontSize(12).font('Helvetica-Bold').text(`Matched Skills (${matched.length})`, 40, y);
      y += 18;
      if (matched.length === 0) {
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('None identified.', 40, y);
        y += 14;
      } else {
        matched.slice(0, 8).forEach((item) => {
          doc.fillColor('#15803d').fontSize(9).font('Helvetica-Bold').text(`• ${item.normalizedName || item.skillName}`, 45, y, { continued: true });
          doc.fillColor('#64748b').font('Helvetica').text(` (${item.category || 'General'}) — ${item.explanation || 'Verified in CV'}`);
          y += 14;
        });
        y += 6;
      }

      // Partially Matched Skills Section
      const partial = matchResult.partialSkills || [];
      if (partial.length > 0) {
        doc.fillColor('#b45309').fontSize(12).font('Helvetica-Bold').text(`Partially Matched Skills (${partial.length})`, 40, y);
        y += 18;
        partial.slice(0, 6).forEach((item) => {
          doc.fillColor('#b45309').fontSize(9).font('Helvetica-Bold').text(`• ${item.normalizedName || item.skillName}`, 45, y, { continued: true });
          doc.fillColor('#64748b').font('Helvetica').text(` — ${item.explanation || 'Related experience found'}`);
          y += 14;
        });
        y += 6;
      }

      // Missing Skills Section
      const missing = matchResult.missingSkills || [];
      doc.fillColor('#b91c1c').fontSize(12).font('Helvetica-Bold').text(`Skill Gaps / Missing Requirements (${missing.length})`, 40, y);
      y += 18;
      if (missing.length === 0) {
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('No significant skill gaps found.', 40, y);
        y += 14;
      } else {
        missing.slice(0, 8).forEach((item) => {
          doc.fillColor('#dc2626').fontSize(9).font('Helvetica-Bold').text(`• ${item.normalizedName || item.skillName}`, 45, y, { continued: true });
          doc.fillColor('#64748b').font('Helvetica').text(` [${item.requirement || 'required'}] — Not found in candidate CV`);
          y += 14;
        });
        y += 10;
      }

      // Learning Recommendations Section
      if (learningResources && learningResources.length > 0) {
        if (y > 650) {
          doc.addPage();
          y = 40;
        }

        doc.fillColor('#1e40af').fontSize(12).font('Helvetica-Bold').text('Recommended Learning Pathways (Curated & Verified)', 40, y);
        y += 18;
        doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text('Verified free educational resources to address identified skill gaps:', 40, y);
        y += 14;

        learningResources.slice(0, 5).forEach((res) => {
          doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(res.title, 45, y, { continued: true });
          doc.fillColor('#2563eb').font('Helvetica').text(` (${res.provider || 'Provider'} - ${res.difficulty || 'beginner'})`);
          y += 12;
          doc.fillColor('#475569').fontSize(8).font('Helvetica').text(`URL: ${res.url}`, 55, y);
          y += 14;
        });
      }

      // Footer Disclaimer
      doc.fontSize(8).fillColor('#94a3b8').text(
        'Disclaimer: SkillMatch AI provides algorithmic decision support and skill gap insights. It does not replace human judgment and makes no autonomous hiring or rejection decisions.',
        40,
        780,
        { align: 'center', width: 515 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateMatchPdf,
};
