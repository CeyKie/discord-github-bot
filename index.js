// Require the necessary discord.js classes
const { Client, Intents } = require('discord.js');
const request = require('request');
const { token, channelId, updateIntervallSeconds, gitUser, gitRepo, gitToken, exludeUsers, includeAttachments } = require('./config.json');

// Checks, if required information are given
isSet(token, "token");
isSet(channelId, "channelId");
isSet(gitUser, "gitUser");
isSet(gitRepo, "gitRepo");
isSet(gitToken, "gitToken");

// Concat repo link with the given Github user and Github repo
const issueLink = "https://api.github.com/repos/" + gitUser + "/" + gitRepo + "/issues";

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// Check if update intervall is configured, otherwise use default (15 seconds)
const fetchIntervall = updateIntervallSeconds ? updateIntervallSeconds * 1000 : 15 * 1000;

// Check if includeAttachments was set in the configuration. If not it will be set to false as default.
const useAttachments = includeAttachments ? includeAttachments : false;

// Login to Discord with your client's token.
// Using async call to work the data, otherwise there is a chance, that the bot is not logged in yet.
client.login(token)
	.then(clientLogin => {
		console.log('Bot logged in');
		fetchChannel(clientLogin)
	})
	.catch(console.error);

/**
 * Fetch channel info to get more data such as messages or author etc.
 * 
 * @param {any} login Client (bot) that has logged in to the discord server
 */
function fetchChannel(login) {
	client.channels.fetch(channelId)
		.then(channel => fetchMessagesFromChannel(channel))
		.catch(console.error);
}

/**
 * Fetch all messages from the given channel to interact with the messages.
 * This body of this method is called periodically.
 * 
 * @param {any} channel Discord channel fetched from the server by ID
 */
function fetchMessagesFromChannel(channel) {
	if (channel.type === 'GUILD_TEXT') {
		setInterval(function () {
			channel.messages
				.fetch()
				.then(messages => fetchMessage(messages))
				.catch(console.error);
		}, fetchIntervall);
    }
}

/**
 * Fetch data from a single message to upload the info to github as an issue.
 * 
 * @param {any} messages All messages from the chosen discord channel
 */
function fetchMessage(messages) {
	messages.forEach(msg => {
		// Make sure an issue will only be created,
		// when the author is not exluded in the configuration
		const authorNotExcluded = !exludeUsers.includes(msg.author.id)

		// TODO: Find a solution to save images, so the message in discord can be deleted to keep it clean
		const notProcessed = !hasReacted(msg.reactions);

		if (authorNotExcluded && notProcessed) {
			let attachments = '';
			if (useAttachments) {
				attachments = includeImages(msg.attachments);
			}

			let contentText = msg.content.split('\n')
			let title = getTitle(contentText);
			let message = getMessage(contentText, msg.author.username, attachments);

			// Creating the github issue from the message
			createGithubIssue(title, message, msg);
		}
	})
}

/**
 * Create an Github issue with the authentication and URL from the configuration
 * and the title and message from the discord message.
 * Marks the message in discord with a check mark, in case it was successfully created in Github.
 * Otherwise an X will be reacted to the discord message.
 * 
 * @param {any} title Issue title, split from the discord message
 * @param {any} message Issue description, split from the discord message
 * @param {any} msg Message retrieved from discord
 */
function createGithubIssue(title, message, msg) {
	request.post(
		{
			url: issueLink,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				'Authorization': 'Bearer ' + gitToken,
				'User-Agent': 'curl/7.64.1'
			},
			json: {
				'title': title,
				'body': message,
				'labels': [
					'bug'
				]
			}
		},
		function (error, response, body) {
			if (!response.statusCode.toString().startsWith('2') || error) {
				msg.react('❌');
			} else {
				const author = msg.author;
				msg.react('✅');
				console.log('Successfully created issue with ID [' + body.number + '] by user [' + author.username + '#' + author.discriminator + '] with ID [' + author.id + ']');
			}
		}
	);
}

/**
 * Get the text of the first part of the message, which is before the first break.
 * In case a user has only typed a message, without seperating title and the actual report
 * The title will be the same as the message, but shortened, if the length of the message is larger than 128
 * 
 * @param {any} contentText Split content of the discord message
 */
function getTitle(contentText) {
	let title = contentText[0];

	if (title.length > 128) {
		title = title.substring(1, 128) + '...';
	}

	return title;
}

/**
 * Get the message out of the content from the discord message.
 * In case the user only typed a small text and didn't seperate title and message
 * or had a too large title, the complete contentText will be returned.
 * In every other case only the message, after the first line break will be returned.
 * 
 * @param {any} contentText Split content of the discord message
 * @param {any} author Author of the discord message
 * @param {any} attachments Attachments in the discord message
 */
function getMessage(contentText, author, attachments) {
	const authorCredits = '<br /> Issue created by: ' + author;
	//let images = "";
	let footNote = authorCredits;

	// Adding the attachments to the issue body
	if (attachments !== '' && attachments !== 'undefined') {
		footNote += "<br /><br />" + attachments;
    }
    
	// The message has no break, therefore, not seperated in to title and description
	if (contentText.length == 1) {
		return contentText[0] + footNote;
	}

	// Length of the title is larger than 128 so it was split. 
	// To not loose any information, the full title will also be part of the issue description
	if (contentText[0].length > 128) {
		return contentText[0] + '<br />' + contentText[1] + footNote;
	}

	// The description was successfully seperated from the title
	// and the title is not larger than 128
	return contentText[1] + footNote;
}

/**
 * Getting the attachments from the discord message
 * and upload them to github, to able to add them to the issue.
 * 
 * @param {any} attachmentsFromMessage
 */
function includeImages(attachmentsFromMessage) {

	let attachments = '';

	attachmentsFromMessage.forEach(attachment => {
		attachments += '![' + attachment.name + '](' + attachment.url + ')';
	});

	return attachments;
}

/**
 * Check if the bot already processed the message by checking the reaction.
 * 
 * @param {any} reactions Reactions of the message
 */
function hasReacted(reactions) {
	let hasReacted = false;
	if (reactions.resolve('✅') != null) {
		hasReacted = reactions.resolve('✅').me;
	}

	if (!hasReacted && reactions.resolve('❌') != null) {
		hasReacted = reactions.resolve('❌').me;
	}

	return hasReacted;
}

/**
 * Check if the config property is set in the config.json
 * 
 * @param {any} config property
 * @param {any} configString property as string
 */
function isSet(config, configString) {
	if (!config || config == '' || config == 'undefined') {
		exitBot(configString);
	}
}

/**
 * Will be called, when a process must be aborted due to a missing property.
 * 
 * @param {any} missingProperty String of the missing property to let the user know which property is affected
 */
function exitBot(missingProperty) {
	console.error("You must add " + missingProperty + " to the config.json");
	process.exit();
}