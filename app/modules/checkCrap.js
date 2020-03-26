const key_crap = ['đm', 'đụ', 'địt', 'đjt', 'dit', 'djt', 'loz', 'lồn', 'buồi', 'cặc', 'cẹc', 'cc', 'cl', 'fuck', 'f.u.c.k', 'dcm', 'bướm', 'dm', 'vl', 'đéo' ];
const regexp = new RegExp(" " + key_crap.join(' | ') + " ", 'g');
module.exports = (input) => {
   if (typeof input == "string")  return regexp.test(` ${input.toLowerCase()} `)
   return false;
}
