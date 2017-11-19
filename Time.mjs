function pad (number) {
  return String(number).padStart(2, '0');
}

export default function Time () {
  var d = new Date;
  return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}
