const express = require("express");
const app = express();
const path = require("path");
const { authenticate } = require("@google-cloud/local-auth");
const fs = require("fs").promises;
const { google } = require("googleapis");

const port = 8080;
// these are the scopes that we want to access 
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://mail.google.com/",
];

// i kept the label name
const labelName = "vacationVishnu";


app.get("/", async (req, res) => {

  //authentication
  const auth = await authenticate({
    keyfilePath: path.join(__dirname, "credentials.json"),
    scopes: SCOPES,
  });




  const gmail = google.gmail({ version: "v1", auth });


  //finding labels available on gmail
  const response = await gmail.users.labels.list({
    userId: "me",
  });


  //finding unreplied mails
  async function getUnrepliesMessages(auth) {
    const gmail = google.gmail({ version: "v1", auth });
    const response = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      q: "is:unread",
    });
    
    return response.data.messages || [];
  }

  //generates a label ID
  async function createLabel(auth) {
    const gmail = google.gmail({ version: "v1", auth });
    try {
      const response = await gmail.users.labels.create({
        userId: "me",
        requestBody: {
          name: labelName,
          labelListVisibility: "labelShow",
          messageListVisibility: "show",
        },
      });
      return response.data.id;
    } catch (error) {
      if (error.code === 409) {
        const response = await gmail.users.labels.list({
          userId: "me",
        });
        const label = response.data.labels.find(
          (label) => label.name === labelName
        );
        return label.id;
      } else {
        throw error;
      }
    }
  }

  async function main() {
    
    const labelId = await createLabel(auth);

    //refreshing in random intervals of 45 and 120 seconds
    setInterval(async () => {
      
      const messages = await getUnrepliesMessages(auth);

      //here I'm checking for messages which haven't gotten any reply
      if (messages && messages.length > 0) {
        for (const message of messages) {
          const messageData = await gmail.users.messages.get({
            auth,
            userId: "me",
            id: message.id,
          });

          const email = messageData.data;
          const hasReplied = email.payload.headers.some(
            (header) => header.name === "In-Reply-To"
          );

          if (!hasReplied) {
            // Craft the reply message
            const replyMessage = {
              userId: "me",
              resource: {
                raw: Buffer.from(
                  `To: ${
                    email.payload.headers.find(
                      (header) => header.name === "From"
                    ).value
                  }\r\n` +
                    `Subject: Re: ${
                      email.payload.headers.find(
                        (header) => header.name === "Subject"
                      ).value
                    }\r\n` +
                    `Content-Type: text/plain; charset="UTF-8"\r\n` +
                    `Content-Transfer-Encoding: 7bit\r\n\r\n` +
                    `Thank you for sending your mail! However I'm currently on Vacation and I shall get back to you once I'm at work\n Vishnu Athreya\r\n`
                ).toString("base64"),
              },
            };

            await gmail.users.messages.send(replyMessage);

            //moving the email to the label from inbox
            gmail.users.messages.modify({
              auth,
              userId: "me",
              id: message.id,
              resource: {
                addLabelIds: [labelId],
                removeLabelIds: ["INBOX"],
              },
            });
          }
        }
      }
    }, Math.floor(Math.random() * (120 - 45 + 1) + 45) * 1000);
  }
  
main();

  res.json({ "this is Auth": auth });
});

app.listen(port, () => {
  console.log(`server is running ${port}`);
});