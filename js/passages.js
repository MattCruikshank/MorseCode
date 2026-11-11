// Passages offered in the "Text to key" picker.
// Characters that aren't enabled in Settings (or have no Morse code) are skipped automatically.
const PASSAGES = [
  {
    group: 'Practice',
    items: [
      { title: 'SOS', text: 'SOS SOS SOS' },
      { title: 'Alphabet', text: 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z' },
      { title: 'Dots only: E I S H', text: 'E I S H EE IS HE SHE HIS' },
      { title: 'Dashes only: T M O', text: 'T M O TO MO TOM MOT' },
      { title: 'Numbers', text: '1 2 3 4 5 6 7 8 9 0' },
      { title: 'Pangram', text: 'The quick brown fox jumps over the lazy dog.' },
      { title: 'What hath God wrought', text: 'What hath God wrought?', by: 'First long-distance telegraph message, Samuel Morse, 1844 (Numbers 23:23)' }
    ]
  },
  {
    group: 'Bible (KJV)',
    items: [
      { title: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', by: 'John 3:16' },
      { title: 'Psalm 23:1', text: 'The LORD is my shepherd; I shall not want.', by: 'Psalm 23:1' },
      { title: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.', by: 'Philippians 4:13' },
      { title: 'Joshua 1:9', text: 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.', by: 'Joshua 1:9' },
      { title: 'Proverbs 3:5-6', text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.', by: 'Proverbs 3:5-6' },
      { title: 'Isaiah 40:31', text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.', by: 'Isaiah 40:31' },
      { title: 'Genesis 1:3', text: 'And God said, Let there be light: and there was light.', by: 'Genesis 1:3' },
      { title: 'Psalm 118:24', text: 'This is the day which the LORD hath made; we will rejoice and be glad in it.', by: 'Psalm 118:24' },
      { title: 'Matthew 5:14', text: 'Ye are the light of the world. A city that is set on an hill cannot be hid.', by: 'Matthew 5:14' },
      { title: '1 Corinthians 13:13', text: 'And now abideth faith, hope, charity, these three; but the greatest of these is charity.', by: '1 Corinthians 13:13' }
    ]
  },
  {
    group: 'American statesmen',
    items: [
      { title: 'Ask not…', text: 'And so, my fellow Americans: ask not what your country can do for you; ask what you can do for your country.', by: 'John F. Kennedy, Inaugural Address, 1961' },
      { title: 'Nothing to fear…', text: 'The only thing we have to fear is fear itself.', by: 'Franklin D. Roosevelt, First Inaugural Address, 1933' },
      { title: 'Four score…', text: 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.', by: 'Abraham Lincoln, Gettysburg Address, 1863' },
      { title: 'With malice toward none…', text: 'With malice toward none, with charity for all, with firmness in the right as God gives us to see the right, let us strive on to finish the work we are in.', by: 'Abraham Lincoln, Second Inaugural Address, 1865' },
      { title: 'A house divided…', text: 'A house divided against itself cannot stand.', by: 'Abraham Lincoln, 1858' },
      { title: 'We hold these truths…', text: 'We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.', by: 'Thomas Jefferson, Declaration of Independence, 1776' },
      { title: 'Give me liberty…', text: 'I know not what course others may take; but as for me, give me liberty or give me death!', by: 'Patrick Henry, 1775' },
      { title: 'Hang together…', text: 'We must, indeed, all hang together, or most assuredly we shall all hang separately.', by: 'Benjamin Franklin (attributed), 1776' },
      { title: 'One life to lose…', text: 'I only regret that I have but one life to lose for my country.', by: 'Nathan Hale, 1776' },
      { title: 'Man in the arena', text: 'The credit belongs to the man who is actually in the arena, whose face is marred by dust and sweat and blood.', by: 'Theodore Roosevelt, 1910' },
      { title: 'We choose to go to the Moon', text: 'We choose to go to the Moon in this decade and do the other things, not because they are easy, but because they are hard.', by: 'John F. Kennedy, Rice University, 1962' },
      { title: 'Tear down this wall', text: 'Mr. Gorbachev, tear down this wall!', by: 'Ronald Reagan, Berlin, 1987' },
      { title: 'The buck stops here', text: 'The buck stops here!', by: 'Harry S. Truman (desk sign)' }
    ]
  }
];
