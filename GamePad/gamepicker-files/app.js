
import games from "./games.js";


let gameHtmlElements = document.getElementsByClassName("game");
let leftArrow = document.querySelector('.left-arrow')
let rightArrow = document.querySelector('.right-arrow')

let currentPage = 1;
const GAMES_PER_PAGE = 6
const FIRST_PAGE = 1;
let LAST_PAGE;
const PORT = 5000

function updateButtons() {
   leftArrow.style.display = rightArrow.style.display = "block"
   if (currentPage === 1) leftArrow.style.display = "none"
   else if (currentPage === LAST_PAGE) rightArrow.style.display = "none"
}

let getLastPage = () => LAST_PAGE = Math.ceil(games.length / GAMES_PER_PAGE)

window.addEventListener('load', async (e) => {
   console.log("loaded");
   getLastPage()  
   console.log(LAST_PAGE);
   updateButtons()
   setGameImagesForPage(currentPage - 1)
})

Array.from(gameHtmlElements).forEach(element => {
   element.addEventListener("click", (e) => {

      console.log("clicked", e.target.dataset.name);
      let gameName = e.target.dataset.name
      
      window.location.href = `/?param=${gameName}`;
      
      return;
      fetch(`http://localhost:5001/?param=${gameName}`)
      .then(response => {
         // handle the response
      })
      .catch(error => {
         // handle the error
      });
   })
})


function setGameImagesForPage(page) {
   Array.from(gameHtmlElements).forEach((gameElement, i) => {
      let pathIndex = i + (page * GAMES_PER_PAGE)
      // if (pathIndex > imagePaths.length) return;
      console.log('Setting path', games[pathIndex].imagePath);
      gameElement.style.backgroundImage = `url(${games[pathIndex].imagePath})`
      gameElement.dataset.name = games[pathIndex].name;
   })
}

leftArrow.addEventListener('click', function(e) {
   console.log("left clicked");
   if (currentPage > FIRST_PAGE) currentPage--;
   console.log(currentPage);
   updateButtons()
   setGameImagesForPage(currentPage - 1)
})

rightArrow.addEventListener('click', function(e) {
   console.log("right clicked");
   if (currentPage < LAST_PAGE) currentPage++;
   console.log(currentPage);
   updateButtons()
   setGameImagesForPage(currentPage - 1)
})





