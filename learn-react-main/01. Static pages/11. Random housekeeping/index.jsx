/**
 * Challenge: set up a new React app from scratch!
 * Hints:
 * 1. Need to import the method to create a new root 
 *    from the "react-dom/client" package)
 * 2. Use that root to render some JSX. For now, just render
 *    an h1 element that says anything you want.
 */
import React, { createElement } from "react"
import { createRoot } from "react-dom/client"
const root = createRoot(document.getElementById("root"))
root.render(
    <div>
    <img src="https://www.reactjs.org/logo-og.png" alt="React Logo" />
    <h1>Let's learn ReactJS!</h1>
    <p>React is a popular JavaScript library for building user interfaces.</p>
    </div>
)
