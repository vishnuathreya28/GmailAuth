const { google } = require("googleapis");

// async function listLabels(auth, userId = "me") {
//   const gmail = google.gmail({ version: "v1", auth });
//   const response = await gmail.users.labels.list({ userId });
//   return response.data.labels || [];
// }

async function createLabel(auth, labelName, userId = "me") {
  const gmail = google.gmail({ version: "v1", auth });
  try {
    const response = await gmail.users.labels.create({
      userId,
      requestBody: {
        name: labelName,
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      },
    });
    return response.data.id;
  } catch (error) {
    // Handle label already exists error
    if (error.code === 409) {
      const labels = await listLabels(auth, userId);
      const existingLabel = labels.find((label) => label.name === labelName);
      return existingLabel.id;
    } else {
      throw error;
    }
  }
}

module.exports = { createLabel };
