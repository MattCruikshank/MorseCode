# Roadmap

## Done: Key mode (v1)

- Free keying, decoded onto a paper tape
- Keying a goal text: a built-in passage or your own text, with the tape advancing on each correct symbol
- Settings for theme, character sets, tape, labels, hints, speed (WPM + Farnsworth), and sound

## Next: Play mode (the card teaches you)

Tap any letter on the card, or type a letter on the keyboard. The page **plays** it: the sidetone beeps, and the path lights up symbol by symbol in real time at the current speed.

- Play whole words and passages, with the tape scrolling in sync.
- Use the existing timing (WPM, Farnsworth) so what you hear matches what you'll be asked to key.
- Add "Repeat" and "Slower" buttons.

Implementation notes: add a scheduler that turns text into a list of `{on|off, ms}` events and drives both `toneOn/toneOff` and `lightPath`. Use Web Audio scheduling (`gain.setValueAtTime` at exact times) for accurate rhythm instead of `setTimeout`.

## Next: Copy / Quiz mode (a completely different UI)

The page **sends** Morse and you **type** what you hear on the keyboard. This mode gets its own screen, with no keying.

- Levels: single characters → words → whole passages, drawn from the same passage list and the custom text.
- Only characters from the enabled sets (letters / numbers / punctuation) are used.
- Option to hide the card entirely (ear only), or show it lighting up as a training aid.
- Scoring: accuracy per character, a "trouble letters" list, and the best WPM reached. Weight practice toward missed characters, in the spirit of the Koch method.
- Option to replay the current item, and to reveal the answer.

## Ideas

- Iambic paddle support (two keys: one for dots, one for dashes; e.g. `[` and `]`)
- Prosigns (`AR`, `SK`, `BT`) as an optional character set
- Progress saved in the browser (characters learned, streaks)
- Installable offline app (PWA)
