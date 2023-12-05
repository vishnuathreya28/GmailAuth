const express = require("express");
const app = express();
const { getAuth } = require("./auth");
const { createLabel } = require("./gmail");
const {
  getUnrepliedMessages,
  getMessage,
  sendReply,
  modifyMessageLabels,
} = require("./email");

const labelName = "Vacation Auto-Reply";

const port = 8080;

app.get("/", async (req, res) => {
  const auth = await getAuth();

  // const labels = await listLabels(auth);
  const labelId = await createLabel(auth, labelName);

  setInterval(async () => {
    const messages = await getUnrepliedMessages(auth);

    if (messages && messages.length > 0) {
      for (const message of messages) {
        const email = await getMessage(auth, message.id);
        const hasReplied = email.payload.headers.some(
          (header) => header.name === "In-Reply-To"
        );

        if (!hasReplied) {
          const replyMessage = {
            userId: "me",
            resource: {
              raw: Buffer.from(/* ... */).toString("base64"),
            },
          };

          await sendReply(auth, replyMessage);
          await modifyMessageLabels(auth, message.id, labelId);
        }
      }
    }
  }, Math.floor(Math.random() * (120 - 45 + 1) + 45) * 1000);

  res.json({ "this is Auth": auth });
});

app.listen(port, () => {
  console.log(`Server is running ${port}`);
});
