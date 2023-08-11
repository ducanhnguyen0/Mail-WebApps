document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Send mail
  document.querySelector('#compose-form').onsubmit = send_mail;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#emails-view-details').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id, mailbox) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);

      // Show compose view and hide other views
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#emails-view-details').style.display = 'block';

      // Display content of email
      document.querySelector('#emails-view-details').innerHTML = `
      <hr>
      <p><strong>From:</strong> ${emails.sender}</p>
      <p><strong>To:</strong> ${emails.recipients}</p>
      <p><strong>Subject:</strong> ${emails.subject}</p>
      <p><strong>Timestamp:</strong> ${emails.timestamp}</p>
      <hr>
      <p>${emails.body}</p>
      `

      // Mark email as read
      if (!emails.read) {
        fetch(`/emails/${emails.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        })
      }

      // Archive or Unarchive
      if (mailbox !== 'sent') {
        const btn_arch = document.createElement('button');
        btn_arch.innerHTML = emails.archived ? 'Unarchive': 'Archive';
        btn_arch.className = "btn btn-primary";
        btn_arch.addEventListener('click', function() {
          fetch(`/emails/${emails.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: !emails.archived
            })
          })
        });
        document.querySelector('#emails-view-details').append(btn_arch);
      }

      // Reply
      const btn_reply = document.createElement('button');
      btn_reply.innerHTML = 'Reply';
      btn_reply.className = "btn btn-primary";
      btn_reply.addEventListener('click', function() {
        compose_email();

        // Clear out composition fields
        document.querySelector('#compose-recipients').value = emails.sender;
        let subject = emails.subject
        if (subject.split()[0] != 'Re:') {
          subject = 'Re: ' + emails.subject
        }
        document.querySelector('#compose-subject').value = subject;
        document.querySelector('#compose-body').value = `On ${emails.timestamp} ${emails.sender} wrote: ${emails.body}`;
      });
      document.querySelector('#emails-view-details').append(btn_reply);
  });
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view-details').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get the mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);

      // Loop through each email in the mailbox
      emails.forEach(email => {

        // Create HTML elements and add events handler
        const element = document.createElement('div');
        element.className = "list-group-item"
        element.innerHTML = `
        <h6>Sender: ${email.sender}</h6>
        <h5>Subject: ${email.subject}</h5>
        <p>${email.timestamp}</p>
        `;

        // Check if the email is read or not
        element.style.backgroundColor = email.read ? 'gray': 'white';
        element.addEventListener('click', function() {
            view_email(email.id, mailbox)
        });
        document.querySelector('#emails-view').append(element);
      })
  });
  }

function send_mail() {

  // Get the data from composition fields
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // POST method
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
  });

}

