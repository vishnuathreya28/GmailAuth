const { google } = require("googleapis");

async function getUnrepliedMessages(auth, userId = "me") {
  const gmail = google.gmail({ version: "v1", auth });
  const response = await gmail.users.messages.list({
    userId,
    labelIds: ["INBOX"],
    q: "is:unread",
  });
  return response.data.messages || [];
}

async function getMessage(auth, userId = "me", messageId) {
  const gmail = google.gmail({ version: "v1", auth });
  return await gmail.users.messages.get({
    userId,
    id: messageId,
  });
}

async function sendReply(auth, replyMessage) {
  const gmail = google.gmail({ version: "v1", auth });
  return await gmail.users.messages.send(replyMessage);
}

async function modifyMessageLabels(auth, messageId, labelId) {
  const gmail = google.gmail({ version: "v1", auth });
  return await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    resource: {
      addLabelIds: [labelId],
      removeLabelIds: ["INBOX"],
    },
  });
}

module.exports = {
  getUnrepliedMessages,
  getMessage,
  sendReply,
  modifyMessageLabels,
};
