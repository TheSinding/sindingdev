# Resume PDF Generator

This script system allows you to generate tailored PDF resumes from your HTML template for specific job applications while keeping your public resume unchanged.

## Features

- 🎯 **Job-specific tailoring** - Highlight relevant skills and experience
- 🤖 **Automated PDF generation** - No manual browser printing needed
- 📝 **Content customization** - Add objectives, emphasize keywords, remove irrelevant sections
- 🔧 **Easy configuration** - Pre-built configs for common job types
- 📊 **ATS-optimized** - Generates clean, parsable PDFs

## Setup

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. The main dependency is Puppeteer, which will download a Chromium browser for PDF generation.

## Usage

### Quick Start

```bash
# List available configurations
npm run resume:list

# Generate a LEGO-specific resume
npm run resume:lego

# Generate a frontend developer resume
npm run resume:frontend

# Generate a startup engineer resume
npm run resume:startup
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run resume:list` | Show all available configurations |
| `npm run resume:help` | Show detailed help |
| `npm run resume:lego` | Generate LEGO Cloud Engineer resume |
| `npm run resume:frontend` | Generate Frontend Developer resume |
| `npm run resume:startup` | Generate Startup Engineer resume |
| `npm run resume:iot` | Generate IoT Engineer resume |
| `npm run resume:cloud` | Generate Cloud/DevOps Engineer resume |

### Custom Configuration

You can also run with any config name:
```bash
npm run generate-resume configName
```

## How It Works

1. **Template Loading**: Loads your base HTML resume from `docs/index.html`
2. **Content Customization**: Applies job-specific modifications:
   - Adds targeted objectives
   - Highlights relevant keywords
   - Emphasizes specific experience
   - Removes irrelevant sections
3. **PDF Generation**: Uses Puppeteer to render the HTML and generate a PDF
4. **Output**: Saves PDFs to `generated-resumes/` directory

## Customization Options

Each configuration can include:

### Company-Specific Objective
```javascript
companyName: 'LEGO Group',
keySkills: 'cloud infrastructure, AWS, Node.js'
```

### Keyword Highlighting
```javascript
highlightSkills: ['cloud', 'AWS', 'Node.js', 'Kubernetes']
```

### Experience Emphasis
```javascript
emphasizeExperience: [
  {
    company: 'Danfoss',
    highlight: ['cloud infrastructure', 'API development']
  }
]
```

### Section Removal
```javascript
removeSections: ['Network Administration', 'Embedded Programming']
```

### Custom References
```yaml
references:
  professional:
    - type: "person"
      name: "John Doe"
      title: "Engineering Manager"
      company: "Company Name"
      email: "john@company.com"
      phone: "+45 1234 5678"
      linkedin: "https://linkedin.com/in/johndoe"
      note: "Optional note about the reference"
    
    - type: "available"
      message: "Custom message about available references"
  
  portfolio:
    - type: "github"
      name: "Project Name"
      url: "https://github.com/user/repo"
      description: "Project description"
      stars: "25"
    
    - type: "page"
      name: "Portfolio Site"
      url: "https://myportfolio.com"
      description: "Complete portfolio"
  
  academic:
    - type: "person"
      name: "Dr. Jane Smith"
      title: "Professor"
      institution: "University Name"
      email: "jane@university.edu"
  
  hideContactSection: false  # Set to true to hide default contact section
```

## Adding New Configurations

1. Create a new YAML file in `scripts/configs/`
2. Follow the existing format:

```yaml
# Job Title Resume Configuration
filename: "resume-job-title.pdf"
jobTitle: "Job Title"

customizations:
  companyName: "Company Name"
  keySkills: "relevant skills for this role"
  
  highlightSkills:
    - "skill1"
    - "skill2"
    - "skill3"
  
  emphasizeExperience:
    - company: "Company Name"
      highlight:
        - "relevant experience"
        - "key achievement"
  
  # Optional: remove irrelevant sections
  removeSections:
    - "Section Name"

pdfOptions:
  format: "A4"
  margin:
    top: "0.5in"
    right: "0.5in"
    bottom: "0.5in"
    left: "0.5in"
```

3. Add a new npm script to `package.json`:
```json
"resume:newjob": "node scripts/cli-generate.js newJobFileName"
```

## Reference Types

The system supports several reference types for maximum flexibility:

### Professional References
- **`person`**: Individual contact with full details (name, title, company, email, phone, LinkedIn)
- **`available`**: Standard "available upon request" with custom message

### Portfolio References  
- **`github`**: GitHub repository with optional star count
- **`page`**: Any web page (portfolio, marketplace listing, etc.)

### Academic References
- **`person`**: Academic contact (professors, thesis supervisors, etc.)

### Reference Features
- 📧 **Email links** - Automatically formatted for easy contact
- 📞 **Phone numbers** - Clean formatting for professional presentation  
- 🔗 **LinkedIn integration** - Direct links to professional profiles
- ⭐ **GitHub stars** - Show repository popularity
- 📝 **Custom notes** - Additional context for each reference
- 🎯 **Flexible messaging** - Custom "available upon request" text
- 🔧 **Section control** - Hide/show default contact section

## Configuration Structure

All configurations are stored as YAML files in `scripts/configs/`. This makes them:
- ✅ **Easy to read and edit**
- ✅ **Version controllable**
- ✅ **Shareable between team members**
- ✅ **Syntax highlighted in most editors**

## Output

PDFs are generated in the `generated-resumes/` directory with descriptive filenames:
- `simon-sinding-resume-lego-cloud-engineer.pdf`
- `simon-sinding-resume-frontend-developer.pdf`
- etc.

## Benefits

- ✅ **Separate from public resume** - Your website stays unchanged
- ✅ **Consistent formatting** - Same visual design, tailored content
- ✅ **Time-saving** - Generate multiple versions quickly
- ✅ **Version control** - Track what was sent to which company
- ✅ **ATS-friendly** - Optimized for parsing systems

## Troubleshooting

### Puppeteer Installation Issues
```bash
# If Puppeteer fails to install Chromium
npm install puppeteer --unsafe-perm=true --allow-root
```

### Path Issues
- Ensure the script is run from the project root directory
- Check that `docs/index.html` exists and is readable

### PDF Generation Fails
- Check console output for detailed error messages
- Ensure sufficient disk space in `generated-resumes/` directory
- Verify HTML template is valid

## Advanced Usage

You can also use the ResumeGenerator class directly in Node.js:

```javascript
const ResumeGenerator = require('./scripts/generate-resume-pdf');

const generator = new ResumeGenerator();
const config = {
  filename: 'custom-resume.pdf',
  customizations: {
    // ... your customizations
  }
};

generator.generateTailoredResume(config);
```