/* Copyright (C) 2020 Yusuf Usta.

Licensed under the GPL-3.0 License;
you may not use this file except in compliance with the License.

WhatsAsena - Yusuf Usta
*/

const Asena = require("../Utilis/events")
const got = require("got")
const fs = require("fs")
const { parseGistUrls, pluginList } = require("../Utilis/Misc")
const { installPlugin, getPlugin, deletePlugin } = require("../Utilis/plugins")
const Language = require("../language")
const Lang = Language.getString("_plugin")

// Import Axios and set your Giphy API key
const axios = require('axios');
const GIPHY_API_KEY = 'nS0UAgP4KFxX68psrBZHaGOQl3njP13p'; // Your Giphy API key

// Function to fetch a random anime kiss GIF
const getAnimeKissGif = async () => {
    try {
        const response = await axios.get(`https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=anime+kiss`);
        return response.data.data.images.original.url; // Return the GIF URL
    } catch (error) {
        console.error('Error fetching GIF:', error);
        return 'https://example.com/default-kiss.gif'; // Fallback GIF URL
    }
};

// Command to install plugins
Asena.addCommand(
    { pattern: "plugin ?(.*)", fromMe: true, desc: Lang.INSTALL_DESC },
    async (message, match) => {
        match = match || message.reply_message.text
        if (!match && match !== "list")
            return await message.sendMessage(Lang.NEED_URL)
        if (match == "list") {
            const plugins = await getPlugin()
            if (!plugins) return await message.sendMessage(Lang.NO_PLUGIN)
            return await message.sendMessage(
                `${Lang.INSTALLED_FROM_REMOTE}\n${plugins}`
            )
        }
        const isValidUrl = parseGistUrls(match)
        if (!isValidUrl) {
            const { url } = await getPlugin(match)
            if (url) return await message.sendMessage(url, { quoted: message.data })
        }
        if (!isValidUrl) return await message.sendMessage(Lang.INVALID_URL)
        for (const url of isValidUrl) {
            try {
                const res = await got(url)
                if (res.statusCode == 200) {
                    let plugin_name = /pattern: ["'](.*)["'],/g.exec(res.body)
                    plugin_name = plugin_name[1].split(" ")[0]
                    fs.writeFileSync("./plugins/" + plugin_name + ".js", res.body)
                    try {
                        require("./" + plugin_name)
                    } catch (e) {
                        await message.sendMessage(
                            Lang.INVALID_PLUGIN + "```\n" + e.stack + "```"
                        )
                        return fs.unlinkSync("./plugins/" + plugin_name + ".js")
                    }
                    await installPlugin(url, plugin_name)
                    await message.sendMessage(
                        Lang.INSTALLED.format(pluginList(res.body).join(","))
                    )
                }
            } catch (error) {
                await message.sendMessage(`${error}\n${url}`)
            }
        }
    }
);

// Command to remove plugins
Asena.addCommand(
    { pattern: "remove (.*)", fromMe: true, desc: Lang.REMOVE_DESC },
    async (message, match) => {
        if (!match) return await message.sendMessage(Lang.NEED_PLUGIN)
        if (match == "all") {
            await deletePlugin()
            return await message.sendMessage("_All plugins deleted Successfully_\n*Restart BOT*")
        }
        const isDeleted = await deletePlugin(match)
        if (!isDeleted) return await message.sendMessage(Lang.NOT_FOUND_PLUGIN)
        delete require.cache[require.resolve("./" + match + ".js")]
        fs.unlinkSync("./plugins/" + match + ".js")
        return await message.sendMessage(Lang.DELETED)
    }
);

// Add the .kissgif command
Asena.addCommand(
    { pattern: "kissgif", fromMe: true, desc: "Send an anime kiss GIF" },
    async (message, match) => {
        const mentionedUser = message.mentioned[0]; // Get the first mentioned user
        if (mentionedUser) {
            const kissGifUrl = await getAnimeKissGif(); // Fetch a random anime kiss GIF
            const responseMessage = `${mentionedUser} received a kiss! (Reio wasta :3)`; // Updated message
            await message.sendMessage(responseMessage, { image: { url: kissGifUrl } }); // Send the GIF
        } else {
            await message.sendMessage("Please mention a user to kiss!");
        }
    }
);

// Existing commands...
