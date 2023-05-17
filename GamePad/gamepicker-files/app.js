
import games from "./games.js";


let gameHtmlElements = document.getElementsByClassName("game");
let leftArrow = document.querySelector('.left-arrow')
let rightArrow = document.querySelector('.right-arrow')
let clickableButtons = document.querySelectorAll(".clickable-button")

let focusedElement = document.activeElement;

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
   getLastPage()  
   updateButtons()
   setGameImagesForPage(currentPage - 1)


   gameHtmlElements[0].focus();
   focusedElement = document.activeElement;
})

Array.from(gameHtmlElements).forEach(element => {
   element.addEventListener("click", (e) => {

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
   gameHtmlElements[0].focus();
   focusedElement = document.activeElement
})

rightArrow.addEventListener('click', function(e) {
   console.log("right clicked");
   if (currentPage < LAST_PAGE) currentPage++;
   console.log(currentPage);
   updateButtons()
   setGameImagesForPage(currentPage - 1)
   gameHtmlElements[0].focus();
   focusedElement = document.activeElement
})


window.addEventListener("keydown", (e) => {
   console.log(e.key);
   handleArrowNavigation(e)
})


function handleArrowNavigation(event) {
   console.log("fokusiran", focusedElement);
   const key = event.key;
 
   // Get the currently focused element
   focusedElement = document.activeElement;
   
 
   // Update the focus based on the arrow key pressed
   switch (key) {
     case 'ArrowLeft':
       // Find the nearest element to the left
       const nearestLeftElement = findNearestElement(clickableButtons, 'ArrowLeft');
       if (!nearestLeftElement) return;
       nearestLeftElement.focus();
       break;
     case 'ArrowRight':
       // Find the nearest element to the right
       const nearestRightElement = findNearestElement(clickableButtons, 'ArrowRight');
       if (!nearestRightElement) return;
       nearestRightElement.focus();
       break;
     case 'ArrowUp':
       // Find the nearest element above
       const nearestUpElement = findNearestElement(clickableButtons, 'ArrowUp');
       if (!nearestUpElement) return;
       nearestUpElement.focus();
       break;
     case 'ArrowDown':
       // Find the nearest element below
       const nearestDownElement = findNearestElement(clickableButtons, 'ArrowDown');
       if (!nearestDownElement) return;
       nearestDownElement.focus();
       break;
     default:
       break;
   }
 }
 

 function findNearestElement(elements, direction) {
   const focusedRect = focusedElement.getBoundingClientRect();
   let currentDistance = Infinity;
   let nearestElement = null;
 
   for (let i = 0; i < elements.length; i++) {
     const element = elements[i];
     const elementRect = element.getBoundingClientRect();
     const distanceX = elementRect.left - focusedRect.left;
     const distanceY = elementRect.top - focusedRect.top;
 
     let isCloser = false;
 
     switch (direction) {
       case 'ArrowLeft':
         if (distanceX < 0 && Math.abs(distanceX) < currentDistance) {
           isCloser = true;
         }
         break;
       case 'ArrowRight':
         if (distanceX > 0 && distanceX < currentDistance) {
           isCloser = true;
         }
         break;
       case 'ArrowUp':
         if (distanceY < 0 && Math.abs(distanceY) < currentDistance) {
           isCloser = true;
         }
         break;
       case 'ArrowDown':
         if (distanceY > 0 && distanceY < currentDistance) {
           isCloser = true;
         }
         break;
       default:
         break;
     }
 
     if (isCloser) {
       currentDistance = Math.abs(distanceX) + Math.abs(distanceY);
       nearestElement = element;
     }
   }
 
   return nearestElement;
 }

 function calculateDistance(element1, element2) {
   const rect1 = element1.getBoundingClientRect();
   const rect2 = element2.getBoundingClientRect();

   const horizontalDistance = Math.abs(rect1.left - rect2.left);
   const verticalDistance = Math.abs(rect1.top - rect2.top);

   return Math.sqrt(
     Math.pow(horizontalDistance, 2) + Math.pow(verticalDistance, 2)
   );
 }