# discord-github-bot

This bot will create a github issue, when a new message will be send to a specific channel in discord. <br />
You can also include the attachments from the message.
To be able to read data from discord, you need to create a discord bot https://discord.com/developers/applications. <br />
In order to use this bot, you need to set up a "config.json" in the root folder (at the level of "index.js"). <br />
To start the bot just type `node .` in the console of the root folder.

## Creating a Discord bot
* Simply follow the link https://discord.com/developers/applications and click on "New Application"
* Give your bot a name and click on "Create"
* Go the the "Bot" section where you can create a new by clicking on "Add Bot". This create a bot named after the application. After adding the bot you can edit the name if you like
* Copy the token of the bot and add it to the config file

## Adding the bot to your Discord server
* In the navigation of your previously created application click on "OAuth2"
* In the sub navigation click on "URL Generator"
* As scope you chose "bot". Afterwards the permissions section for this bot will open
* Set the permission "Administrator"
* Copy the URL at the end of the site and paste it in to your browser address line
* Add the Bot to the prefered server

## Creating a Github token
* Go to your settings, by clicking your profile image in the upper right corner in Github and choosing "settings"
* Chose "developer settings" in the navigation of the settings
* Click on "Personal access tokens" and "Generate new token"
* Make in note, to be able to recognize this token and set the expiration date
** If you chose to let your token expire you must remember to renew it after expiration, otherwise github will not grant access for the request of the bot
* Scopes: `repo`, `write:packages`

## Configuration properties
| Property				 | Optional | Example								 | Description																						 |
| ---------------------- | -------- | -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| token					 | no		| "aaodj29eqdekwojd92ahe28dhadjda02dﬂ0j" | The token of the discord bot																		 |
| channelId				 | no		| "84704831957103822931"				 | ID of the discord issue channel on your server													 |
| updateIntervallSeconds | yes		| 15									 | Number in seconds how often the bot should fetch the channels content							 |
| gitUser				 | no		| "CeyKie"							     | URL of the GIT repository, the issue should be created in										 |
| gitRepo				 | no		| "discord-github-bot"				     | URL of the GIT repository, the issue should be created in										 |
| gitToken				 | no		| "asd_asodjawidzh28hadjuawd"			 | Token, created in your Github account, to authenticate the request								 |
| exludeUsers			 | yes		| [ "935710237185", "105681023103" ]	 | An array, which includes a list of strings from the users, the bot should ignore. Can be empty [] |
| includeAttachments	 | yes		| false								     | Set this to true, if you want to include attachments from the message in the Github issue.		 |