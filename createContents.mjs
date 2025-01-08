import puppeteer from 'puppeteer';

const searchTerms = [
  "Machine learning basics",
  "Deep learning explained",
  "Essential coding skills",
  "Build MVP quickly",
  "UI vs UX",
  "Tech jobs demand",
  "Developer soft skills",
  "Python for beginners",
  "AI social media",
  "Best programming laptops",
  "Why startups fail",
  "Cloud computing guide",
  "Blockchain technology fundamentals",
  "Cybersecurity essential tips",
  "Choosing programming language",
  "Remote team tools",
  "Personal branding tips",
  "Agile methodology overview",
  "Free coding resources",
  "Robotics for beginners",
  "Create first website",
  "Hacking 101 basics",
  "Monetize your apps",
  "IoT introduction guide",
  "Gamification in education",
  "Pick web framework",
  "Data visualization tips",
  "AI marketing automation",
  "Personal portfolio site",
  "What is 5G",
  "Developer resume tips",
  "Startup culture building",
  "SEO fundamentals guide",
  "Version control basics",
  "Big data explained",
  "Microservices architecture introduction",
  "UI design tools",
  "API integration guide",
  "No-code entrepreneurship",
  "Neural networks basics",
  "Top tech blogs",
  "Low-code vs coding",
  "Voice assistant rise",
  "Plan a hackathon",
  "Hire remote developers",
  "Startup brand identity",
  "AI in healthcare",
  "Intro to MongoDB",
  "Docker environment setup",
  "Ethical hacking difference",
  "Learn coding fast",
  "What is AR",
  "AI e-commerce personalization",
  "Manage technical debt",
  "Best tech podcasts",
  "Machine translation basics",
  "User stories writing",
  "Freelance vs full-time",
  "Free code snippets",
  "What is deepfake",
  "Predictive analytics business",
  "Nearshore vs offshore",
  "Top tech communities",
  "Intro 3D printing",
  "User testing steps",
  "Market a product",
  "AI digital advertising",
  "Choosing CMS platform",
  "Mobile app security",
  "ReactJS getting started",
  "Data ethics importance",
  "Email marketing startup",
  "Cloud functions serverless",
  "AI chatbots vs humans",
  "A/B testing apps",
  "What is DevSecOps",
  "Pick cloud provider",
  "Augmented analytics explained",
  "Product roadmap tips",
  "GitHub Actions basics",
  "IT consulting vs in-house",
  "Edge computing future",
  "Deep learning frameworks",
  "Growth hacking tactics",
  "AI bias fairness",
  "Container orchestration basics",
  "Website performance improvements",
  "Tech conference networking",
  "Data lakes vs warehouses",
  "Adopt agile mindset",
  "RPA basics explained",
  "Mobile UI best practices",
  "Secure REST APIs",
  "Product launch success",
  "HTML5 vs native",
  "Code review practices",
  "Intro CI/CD pipelines",
  "Improve user retention",
  "Remote collaboration software",
  "Ethical AI accountability"
];

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',

    ]
  });
  const page = await browser.newPage();

  await page.goto('https://askbob.online');

  for (const term of searchTerms) {
    await page.waitForSelector('.search-input');

    setTimeout(() => {}, 5000);
    await page.type('.search-input', term);
    await page.click('.search-button');
    
    
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    setTimeout(() => {}, 5000);
    await page.evaluate(() => document.querySelector('#search-input').value = '');
  }

  await browser.close();
})();