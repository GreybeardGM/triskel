/**
 * Generate a standardized chat card with optional header, roll visualization, and content.
 *
 * @param {object} [options={}]
 * @param {string} [options.title=""]        - Optional header title text.
 * @param {string} [options.subtitle=""]     - Optional header subtitle text.
 * @param {string} [options.image=""]        - Optional header image URL.
 * @param {string} [options.content=""]      - HTML content to render inside the body.
 * @param {Roll|null} [options.roll=null]      - Optional Foundry Roll instance to display.
 * @param {object|null} [options.speaker=null] - Optional speaker override for the chat message.
 * @param {string} [options.flavor=""]       - Optional flavor text for the chat message.
 * @param {string|null} [options.rollMode=null]- Roll mode override (defaults to current core roll mode).
 * @param {Array<string>|null} [options.whisper=null] - Explicit whisper recipients; overrides roll mode behavior.
 * @param {boolean} [options.blind=false]      - Whether the message should be blind to players.
 * @param {User|string|null} [options.user=null] - User who sends the message (defaults to current user).
 */
export async function chatOutput({
  title = "",
  subtitle = "",
  image = "",
  content = "",
  roll = null,
  speaker = null,
  flavor = "",
  rollMode = null,
  whisper = null,
  blind = false,
  user = null
} = {}) {
  const resolvedSpeaker = speaker ?? ChatMessage.getSpeaker();
  const resolvedRollMode = rollMode ?? game.settings.get("core", "rollMode");
  const gmRecipients = ChatMessage.getWhisperRecipients("GM").map(gm => gm.id);

  let resolvedWhisper = whisper;
  let resolvedBlind = blind;

  if (!Array.isArray(resolvedWhisper)) {
    switch (resolvedRollMode) {
      case "selfroll":
        resolvedWhisper = [game.user.id];
        break;
      case "gmroll":
        resolvedWhisper = gmRecipients;
        break;
      case "blindroll":
        resolvedWhisper = gmRecipients;
        resolvedBlind = true;
        break;
      default:
        resolvedWhisper = null;
    }
  }

  let rollHTML = "";

  if (roll) {
    if (!roll._evaluated) {
      await roll.evaluate();
    }

    rollHTML = await roll.render();
  }

  const templateData = {
    title,
    subtitle,
    image,
    roll: rollHTML,
    hasHeader: Boolean(title || subtitle || image),
    hasRoll: Boolean(roll),
    content
  };

  const html = await foundry.applications.handlebars.renderTemplate(
    "systems/triskel/templates/chat/chat-output.hbs",
    templateData
  );

  const messageData = {
    user: typeof user === "string" ? user : user?.id ?? game.user.id,
    speaker: resolvedSpeaker,
    content: html,
    flavor,
    style: roll ? "roll" : "other",
    rolls: roll ? [roll] : undefined,
    sound: roll ? CONFIG.sounds.dice : undefined,
    whisper: resolvedWhisper ?? undefined,
    blind: resolvedBlind || undefined
  };

  return ChatMessage.create(messageData, { rollMode: resolvedRollMode });
}
