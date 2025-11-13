1. Where does React put all of the elements I create in JSX when I 
   call `root.render()`?
All the elements I render get put inside the div with the id of "root" (or what ever element I might select when calling root).


2. What would show up in my console if I were to run this line of code:
```
console.log(<h1>Hello world!</h1>)
```
An object! Unlike creating an HTML element in vanilla DOM JS, what gets created from the JSX we have in our React will use to fill in the view.

3. What's wrong with this code:
```
root.render(
    <h1>Hi there</h1>
    <p>This is my website!</p>
)
```
You can only render 1 parent element at a time. The parent element can have as many cjildren as you want.

4. What does it mean for something to be "declarative" instead of "imperative"?

*Imperative* means we need to give specific step-by-step instructions on how to
accomplish a task.
*Declarative* means we can write our code to simply "describe" *what* should show up
on the page and allow the rool (React, e.g.) to handle the details on *how* to
put those things on the page.

5. What does it mean for something to be "composable"?
Can be renderd
We have pieces that are small in size. These can be put together to form something larger or greater than the sum of the individual pieces.