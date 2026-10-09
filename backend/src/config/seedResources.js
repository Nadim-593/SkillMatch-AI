const LearningResource = require('../models/LearningResource');
const SkillTaxonomy = require('../models/SkillTaxonomy');

const curatedResources = [
  {
    title: 'MDN JavaScript Guide & Reference',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
    skillTag: 'JavaScript',
    normalizedSkill: 'JavaScript',
    provider: 'Mozilla Developer Network',
    resourceType: 'documentation',
    isFree: true,
    difficulty: 'beginner',
    description: 'Comprehensive guide to modern JavaScript, from fundamentals to advanced closures and asynchronous programming.',
  },
  {
    title: 'TypeScript Official Handbook',
    url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
    skillTag: 'TypeScript',
    normalizedSkill: 'TypeScript',
    provider: 'Microsoft',
    resourceType: 'documentation',
    isFree: true,
    difficulty: 'intermediate',
    description: 'Official comprehensive handbook covering static typing, generics, interfaces, and compiler configurations.',
  },
  {
    title: 'React Official Documentation & Interactive Tutorial',
    url: 'https://react.dev/learn',
    skillTag: 'React',
    normalizedSkill: 'React',
    provider: 'React Core Team',
    resourceType: 'tutorial',
    isFree: true,
    difficulty: 'beginner',
    description: 'Modern guide covering functional components, React hooks (useState, useEffect), state management, and best practices.',
  },
  {
    title: 'Node.js Official Getting Started Guide',
    url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs',
    skillTag: 'Node.js',
    normalizedSkill: 'Node.js',
    provider: 'OpenJS Foundation',
    resourceType: 'documentation',
    isFree: true,
    difficulty: 'beginner',
    description: 'Introduction to server-side JavaScript runtime, event loop, asynchronous I/O, and npm ecosystem.',
  },
  {
    title: 'Express.js Getting Started & Routing Guide',
    url: 'https://expressjs.com/en/starter/installing.html',
    skillTag: 'Express.js',
    normalizedSkill: 'Express.js',
    provider: 'Express Community',
    resourceType: 'documentation',
    isFree: true,
    difficulty: 'beginner',
    description: 'Fast, minimalist web framework for Node.js. Covers middleware, routing, and REST API development.',
  },
  {
    title: 'Python Official Tutorial',
    url: 'https://docs.python.org/3/tutorial/',
    skillTag: 'Python',
    normalizedSkill: 'Python',
    provider: 'Python Software Foundation',
    resourceType: 'documentation',
    isFree: true,
    difficulty: 'beginner',
    description: 'Official introductory tutorial covering data structures, object-oriented programming, and the standard library.',
  },
  {
    title: 'FastAPI Tutorial & User Guide',
    url: 'https://fastapi.tiangolo.com/tutorial/',
    skillTag: 'FastAPI',
    normalizedSkill: 'FastAPI',
    provider: 'Tiangolo / FastAPI',
    resourceType: 'tutorial',
    isFree: true,
    difficulty: 'intermediate',
    description: 'Step-by-step tutorial building high-performance asynchronous REST APIs with Pydantic and OpenAPI.',
  },
  {
    title: 'MongoDB Getting Started Tutorial',
    url: 'https://www.mongodb.com/docs/manual/tutorial/getting-started/',
    skillTag: 'MongoDB',
    normalizedSkill: 'MongoDB',
    provider: 'MongoDB Inc.',
    resourceType: 'documentation',
    isFree: true,
    difficulty: 'beginner',
    description: 'Learn document database fundamentals, CRUD operations, indexing, and aggregation pipelines.',
  },
  {
    title: 'PostgreSQL Official Tutorial',
    url: 'https://www.postgresql.org/docs/current/tutorial.html',
    skillTag: 'PostgreSQL',
    normalizedSkill: 'PostgreSQL',
    provider: 'PostgreSQL Global Development Group',
    resourceType: 'documentation',
    isFree: true,
    difficulty: 'intermediate',
    description: 'Relational database architecture, advanced SQL queries, foreign keys, transactions, and indexing.',
  },
  {
    title: 'SQLBolt — Interactive SQL Lessons',
    url: 'https://sqlbolt.com/',
    skillTag: 'SQL',
    normalizedSkill: 'SQL',
    provider: 'SQLBolt',
    resourceType: 'tutorial',
    isFree: true,
    difficulty: 'beginner',
    description: 'Interactive in-browser lessons with queries, joins, constraints, and aggregation functions.',
  },
  {
    title: 'Docker Get Started & Containerization Guide',
    url: 'https://docs.docker.com/get-started/',
    skillTag: 'Docker',
    normalizedSkill: 'Docker',
    provider: 'Docker Inc.',
    resourceType: 'documentation',
    isFree: true,
    difficulty: 'beginner',
    description: 'Hands-on guide to containerizing applications, building Dockerfiles, and multi-container orchestration with Compose.',
  },
  {
    title: 'Kubernetes Basics Interactive Tutorial',
    url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/',
    skillTag: 'Kubernetes',
    normalizedSkill: 'Kubernetes',
    provider: 'Cloud Native Computing Foundation',
    resourceType: 'tutorial',
    isFree: true,
    difficulty: 'intermediate',
    description: 'Learn cluster deployment, pods, services, scaling, and rolling updates in an interactive terminal environment.',
  },
  {
    title: 'Pro Git Book (Complete Free Version)',
    url: 'https://git-scm.com/book/en/v2',
    skillTag: 'Git',
    normalizedSkill: 'Git',
    provider: 'Scott Chacon & Ben Straub',
    resourceType: 'book',
    isFree: true,
    difficulty: 'beginner',
    description: 'The definitive book on Git version control, branching workflows, remotes, and internal architecture.',
  },
  {
    title: 'AWS Cloud Essentials Digital Training',
    url: 'https://aws.amazon.com/training/digital/aws-cloud-essentials/',
    skillTag: 'AWS',
    normalizedSkill: 'AWS',
    provider: 'Amazon Web Services',
    resourceType: 'course',
    isFree: true,
    difficulty: 'beginner',
    description: 'Official free foundational training covering compute (EC2), storage (S3), database (RDS), and IAM security.',
  },
  {
    title: 'Tailwind CSS Official Documentation & Examples',
    url: 'https://tailwindcss.com/docs/installation',
    skillTag: 'Tailwind CSS',
    normalizedSkill: 'Tailwind CSS',
    provider: 'Tailwind Labs',
    resourceType: 'documentation',
    isFree: true,
    difficulty: 'beginner',
    description: 'Utility-first CSS framework guide covering flexbox, grid, responsive design, dark mode, and customizations.',
  },
  {
    title: 'Scikit-Learn Machine Learning in Python Guide',
    url: 'https://scikit-learn.org/stable/getting_started.html',
    skillTag: 'Machine Learning',
    normalizedSkill: 'Machine Learning',
    provider: 'Scikit-Learn Developers',
    resourceType: 'documentation',
    isFree: true,
    difficulty: 'intermediate',
    description: 'Practical introduction to supervised and unsupervised algorithms, model evaluation, and feature preprocessing.',
  },
];

/**
 * Seed learning resources into MongoDB if empty or update existing.
 */
const seedLearningResources = async () => {
  try {
    for (const res of curatedResources) {
      await LearningResource.findOneAndUpdate(
        { url: res.url },
        res,
        { upsert: true, new: true }
      );
    }
    console.log(`[SEED] Curated learning resources verified (${curatedResources.length} items).`);
  } catch (error) {
    console.error('[SEED ERROR] Failed to seed learning resources:', error.message);
  }
};

module.exports = {
  curatedResources,
  seedLearningResources,
};
