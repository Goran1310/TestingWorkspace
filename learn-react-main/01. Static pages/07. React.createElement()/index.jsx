// import React from "react"
// import { createRoot } from "react-dom/client"

// const root = createRoot(document.getElementById("root"))
// const reactElement = React.createElement(
//   "h1",
//   { className: "header" },
//   "Hello from React!"
// )
// console.log(reactElement)

// root.render(
//     reactElement
// )




 // import { createRoot } from "react-dom/client"
 // const root = createRoot(document.getElementById("root"))

// root.render (
//<h1>Hello, React !< /h1>


/* 
Challenge - recreate the above line of code in vanilla JS by creating and
appending an h1 to our div#root (without using innerHTML).

- Create a new h1 element (createElement)
- Give it some textContent
- Give it a class name of "header"
- append it as a child (using 'appendChild') of the div#root

Don't use innerHTML to adjust the div#root's content!
*/

// Vanilla JavaScript solution:
const h1 = document.createElement("h1")
h1.textContent = "This is imperative coding!"
h1.className = "header"
document.getElementById("root").appendChild(h1)