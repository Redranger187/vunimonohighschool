(() => {
  const form = document.querySelector('#contact-form');
  const status = document.querySelector('#contact-form-status');

  function setMailLinksToNewTab(root) {
    root.querySelectorAll?.('a[href^="mailto:"]').forEach(link => {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
  }

  setMailLinksToNewTab(document);
  new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) setMailLinksToNewTab(node);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  if (!form || !status) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const values = new FormData(form);
    const body = [
      `Full name: ${values.get('fullName')}`,
      `Phone contact: ${values.get('phone')}`,
      `Email address: ${values.get('email')}`,
      '',
      `Message/concern: ${values.get('message')}`
    ].join('\n');
    const subject = `School website enquiry from ${values.get('fullName')}`;
    const href = `mailto:${form.dataset.recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const draftLink = document.createElement('a');
    draftLink.href = href;
    draftLink.target = '_blank';
    draftLink.rel = 'noopener noreferrer';
    draftLink.textContent = 'Open email draft';

    status.replaceChildren(
      document.createTextNode('Your configured email service should open in a new tab. Send the draft there to complete delivery. If it did not open, '),
      draftLink,
      document.createTextNode('.')
    );
    draftLink.click();
  });
})();