const explorer = document.querySelector('[data-workflow-explorer]');

if (explorer) {
  const scenarios = {
    rag: {
      name: 'Document Q&A', project: 'Omnichannel RAG', href: 'projects/omnichannel-rag.html',
      steps: [
        ['Retrieve the evidence', 'Dense search and BM25 find candidate passages in a shared knowledge base.'],
        ['Choose the strongest context', 'Rank fusion combines the results. A cross-encoder reranks the passages before the language model answers.'],
        ['Answer with sources', 'Use the selected context to answer on the website or WhatsApp, with supporting sources for review.'],
      ],
    },
    voice: {
      name: 'Voice sales', project: 'SareeBot AI', href: 'projects/sareebot.html',
      steps: [
        ['Look up the product', 'Connect a customer request to inventory information through a dedicated business tool.'],
        ['Choose the next operation', 'Work out whether the conversation needs customer verification, an inventory check, an order, or a human handoff.'],
        ['Move the order forward', 'Share product details on WhatsApp, generate a Razorpay payment link, or escalate to a person when needed.'],
      ],
    },
    resume: {
      name: 'Resume tailoring', project: 'ResumeAI', href: 'projects/resumeai.html',
      steps: [
        ['Read the existing experience', 'Extract resume content into structured data and use the target job description as context.'],
        ['Match the content to the role', 'Tailor the supplied experience to the job description without inventing skills or employment history.'],
        ['Render the document', 'Populate HTML/CSS templates and use Playwright with Chromium to produce the tailored PDF.'],
      ],
    },
  };
  const stageNames = ['Knowledge', 'Reasoning', 'Actions'];
  const select = explorer.querySelector('#workflow-scenario');
  const play = explorer.querySelector('[data-workflow-play]');
  const panel = explorer.querySelector('#workflow-panel');
  const announcement = explorer.querySelector('[data-workflow-announcement]');
  const projectLink = explorer.querySelector('[data-workflow-project]');
  let step = 0;
  let playing = false;
  let finished = false;
  let timer;

  const render = (announce = true) => {
    const scenario = scenarios[select.value];
    const [heading, description] = scenario.steps[step];
    explorer.classList.toggle('workflow-playing', playing);
    explorer.querySelectorAll('[data-workflow-step]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.workflowStep) === step)));
    explorer.querySelectorAll('[data-orbit-node]').forEach((node) => node.classList.toggle('is-active', Number(node.dataset.orbitNode) === step));
    explorer.querySelectorAll('[data-workflow-label]').forEach((label) => label.classList.toggle('is-active', Number(label.dataset.workflowLabel) === step));
    explorer.querySelector('[data-workflow-position]').textContent = finished ? 'Walkthrough complete / Actions' : `Step ${step + 1} of 3 / ${stageNames[step]}`;
    explorer.querySelector('[data-workflow-heading]').textContent = heading;
    explorer.querySelector('[data-workflow-description]').textContent = description;
    explorer.querySelector('[data-play-label]').textContent = playing ? 'Pause' : finished ? 'Replay' : 'Play';
    play.setAttribute('aria-label', playing ? 'Pause workflow' : finished ? 'Replay workflow' : 'Play workflow');
    projectLink.href = scenario.href;
    projectLink.textContent = `Explore ${scenario.project} \u2197`;
    if (announce) announcement.textContent = `${scenario.name}. ${finished ? 'Walkthrough complete.' : `Step ${step + 1} of 3.`} ${stageNames[step]}: ${heading}.`;
  };
  const stop = () => {
    clearTimeout(timer);
    playing = false;
  };
  const advance = () => {
    if (step < 2) {
      step += 1;
      render();
      timer = setTimeout(advance, 2400);
    } else {
      playing = false;
      finished = true;
      render();
    }
  };

  play.addEventListener('click', () => {
    if (playing) {
      stop();
      render(false);
      announcement.textContent = `Paused at ${stageNames[step]}.`;
      return;
    }
    if (finished || step === 2) step = 0;
    finished = false;
    playing = true;
    render();
    timer = setTimeout(advance, 2400);
  });
  explorer.querySelectorAll('[data-workflow-step]').forEach((button) => {
    button.addEventListener('click', () => {
      stop();
      step = Number(button.dataset.workflowStep);
      finished = false;
      render();
    });
  });
  const reset = () => {
    stop();
    step = 0;
    finished = false;
    render();
  };
  select.addEventListener('change', reset);
  explorer.querySelector('[data-workflow-reset]').addEventListener('click', reset);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) {
      stop();
      render(false);
    }
  });
  window.addEventListener('pagehide', () => {
    stop();
    render(false);
  });

  render(false);
  explorer.querySelector('.workflow-controls').hidden = false;
  explorer.querySelector('.orbit-hotspots').hidden = false;
  explorer.querySelector('[data-workflow-fallback]').hidden = true;
  panel.hidden = false;
  explorer.classList.add('workflow-enhanced');
}
