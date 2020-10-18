/* Magic Missile - by DPro
This module adds a chat command /magicmissile (or /mm for short) to allow you to cast the
5e spell Magic Missile at a desired level. The default level is 1.
Chatcommands:
/magicmissile [level]
/mm [level]
*/

class MagicMissile {
  onChatMessage(message, content, data) {
    if(content.startsWith('/mm') || content.startsWith('/magicmissile')) {
      let level = 1;

      // parse the level from chat message
      const messageParts = content.split(' ');
      if(messageParts.length > 1) {
        let parsedLevel = parseInt(messageParts[1]);
        if(parsedLevel >= 1 && parsedLevel <= 9) {
          level = parsedLevel;
        }
      }

      // calculate the damage roll
      const numMissiles = 2 + level;
      const roll = new Roll(`${numMissiles}d4 + ${numMissiles}`);
      roll.roll();

        // produce new chat message
      roll.render().then(element => {
        ChatMessage.create({
          content: `<div class="magic-missile">CASTING MAGIC MISSILE AT LEVEL ${level}</div>${element}`,
          type: CHAT_MESSAGE_TYPES.ROLL,
          speaker: data.speaker,
          roll
        }, {});
      });

      return false;
    }
  }
}

Hooks.on("setup", () => {
  const magicMissile = new MagicMissile();
  Hooks.on("chatMessage", magicMissile.onChatMessage.bind(magicMissile));
});
