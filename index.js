// Require the necessary discord.js classes
const Discord = require("discord.js");
const request = require("request");
const config = require("./config/config.json");

// Checks, if required information are given
isSet(config.token, "token");
isSet(config.channelId, "channelId");
isSet(config.gitUser, "gitUser");
isSet(config.gitRepo, "gitRepo");
isSet(config.gitToken, "gitToken");

// Concat repo link with the given Github user and Github repo
const issueLink = `https://api.github.com/repos/${config.gitUser}/${config.gitRepo}/issues`;

// Create a new client instance
const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES],
});

// Check if includeAttachments was set in the configuration. If not it will be set to false as default.
const useAttachments = config.includeAttachments
  ? config.includeAttachments
  : false;

const successMessage = config.successMessage
  ? config.successMessage
  : "Your issue was successfully created. We will work on it asap.";

// Login to Discord with your client's token.
// Using async call to work the data, otherwise there is a chance, that the bot is not logged in yet.
client
  .login(config.token)
  .then(() => {
    console.log(`Bot ${client.user.tag} logged in`);
    fetchChannel();
  })
  .catch(console.error);

/**
 * Fetch channel info to get more data such as messages or author etc.
 */
function fetchChannel() {
  client.channels
    .fetch(config.channelId)
    .then((channel) => {
      fetchMessagesFromChannel(channel);
    })
    .catch(console.error);
}

/**
 * Collects messages, that are written in to the configured channel.
 * The message collector watches a channel for new messages.
 *
 * @param {Discord.AnyChannel} channel Discord channel fetched from the server by ID
 */
function fetchMessagesFromChannel(channel) {
  const collector = channel.createMessageCollector();
  collector.on("collect", (message) => {
    getMessage(message, channel);
  });
}

/**
 * Get data from a single message to upload the info to github as an issue.
 *
 * @param {Discord.Message} messages All messages from the chosen discord channel
 * @param {Discord.AnyChannel} channel Discord channel fetched from the server by ID
 */
function getMessage(message, channel) {
  // Make sure an issue will only be created,
  // when the author is not exluded in the configuration
  const authorNotExcluded = !config.exludeUsers.includes(message.author.id);

  if (authorNotExcluded) {
    let attachments = "";
    if (useAttachments) {
      attachments = includeImages(message.attachments);
    }

    const contentText = message.content.split("\n");
    const title = getTitle(contentText);
    const content = createGitHubContent(
      contentText,
      message.author.username,
      attachments
    );

    // Creating the github issue from the message
    createGitHubIssue(title, content, message, channel);
  }
}

/**
 * Create a Github issue with the authentication and URL from the configuration
 * and the title and message from the discord message.
 * Marks the message in discord with a check mark, in case it was successfully created in Github.
 * Otherwise an X will be reacted to the discord message.
 *
 * @param {string} title Issue title, split from the discord message
 * @param {string} content Issue description, split from the discord message
 * @param {Discord.Message} message Message retrieved from discord
 * @param {Discord.AnyChannel} channel Discord channel fetched from the server by ID
 */
function createGitHubIssue(title, content, message, channel) {
  request.post(
    {
      url: issueLink,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer " + config.gitToken,
        "User-Agent": "curl/7.64.1",
      },
      json: {
        title: title,
        body: content,
        labels: ["bug"],
      },
    },
    function (error, response, body) {
      if (
        response.statusCode.toString().startsWith("2") &&
        (!error || error == "undefined" || error == "")
      ) {
        const author = message.author;
        console.log(
          "Successfully created issue with ID [" +
            body.number +
            "] by user [" +
            author.username +
            "#" +
            author.discriminator +
            "] with ID [" +
            author.id +
            "]"
        );

        if (message.deletable) {
          // Send info message to user, that the issue was created successfully
          channel.send(successMessage).then((msg) => {
            // Delete info message after 90 seconds
            setTimeout(() => {
              message.delete();
              msg.delete();
            }, 90000);
          });
        } else {
          message.react("✅");
        }
      } else {
        message.react("❌");
      }
    }
  );
}

/**
 * Get the text of the first part of the message, which is before the first break.
 * In case a user has only typed a message, without seperating title and the actual report
 * The title will be the same as the message, but shortened, if the length of the message is larger than 128
 *
 * @param {string[]} contentText Split content of the discord message
 * @returns {string} title for the github ticket
 */
function getTitle(contentText) {
  let title = contentText[0];

  if (title.length > 128) {
    title = title.substring(1, 128) + "...";
  }

  return title;
}

/**
 * Get the message out of the content from the discord message.
 * In case the user only typed a small text and didn't seperate title and message
 * or had a too large title, the complete contentText will be returned.
 * In every other case only the message, after the first line break will be returned.
 *
 * @param {string[]} contentText Split content of the discord message
 * @param {string} author Author of the discord message
 * @param {string} attachments Attachments in the discord message
 * @returns {string} returns the content for github ticket
 */
function createGitHubContent(contentText, author, attachments) {
  const authorCredits = "<br /> Issue created by: " + author;
  //let images = "";
  let footNote = authorCredits;

  // Adding the attachments to the issue body
  if (attachments !== "" && attachments !== "undefined") {
    footNote += "<br /><br />" + attachments;
  }

  // The message has no break, therefore, not seperated in to title and description
  if (contentText.length == 1) {
    return contentText[0] + footNote;
  }

  // Length of the title is larger than 128 so it was split.
  // To not loose any information, the full title will also be part of the issue description
  if (contentText[0].length > 128) {
    return contentText[0] + "<br />" + contentText[1] + footNote;
  }

  // The description was successfully seperated from the title
  // and the title is not larger than 128
  return contentText[1] + footNote;
}

/**
 * Getting the attachments from the discord message
 * and upload them to github, to able to add them to the issue.
 * 
 * @param {Map<Snowflake, MessageAttachment>} attachmentsFromMessage 
 * @returns {string} A string which includes all attachments
 */
function includeImages(attachmentsFromMessage) {
  let attachments = "";

  attachmentsFromMessage.forEach((attachment) => {
    attachments += "![" + attachment.name + "](" + attachment.url + ")";
  });

  return attachments;
}

/**
 * Check if the config property is set in the config.json
 *
 * @param {Object} config property
 * @param {string} configString property as string
 */
function isSet(config, configString) {
  if (!config || config == "" || config == "undefined") {
    exitBot(configString);
  }
}

/**
 * Will be called, when a process must be aborted due to a missing property.
 *
 * @param {string} missingProperty String of the missing property to let the user know which property is affected
 */
function exitBot(missingProperty) {
  console.error("You must add " + missingProperty + " to the config.json");
  process.exit();
}
