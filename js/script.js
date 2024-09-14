
/* tur the menu hamburguer into a x ---------*/

const menuHamburguer = document.querySelector (".menu-hamburguer");
menuHamburguer .addEventListener ('click', () => {
  console.log("OK");    //LOG
});

function toggleMenu () {
const nav = document. querySelector('.nav-responsive');
console.log(nav); //LOG
menuHamburguer.classList.toggle('change');

if (menuHamburguer.classList.contains('change')) {
  nav.style.display = 'block';

  
}


}