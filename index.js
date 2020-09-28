// creating variables and assigning npm packages to them
const { prompt } = require('inquirer')
const axios = require('axios')
const shuffle = require('shuffle-array')
const { writeFile, readFile } = require('fs')
const { promisify } = require('util')

const wf = promisify(writeFile)
const rf = promisify(readFile)

// creating variables to be used later
let categories = []
let questions = []
let index = 0
let points = []

// function to end the game and display the scores
const endGame = () => {
  console.log(`You got ${points} out of 10 questions right!`)
  prompt({
    type: 'input',
    name: 'username',
    message: 'Please enter a username'
  })
    .then(({ username }) => {
      // reads the leaderboard for usernames and scores
      rf('leaderboard.json', 'utf-8')
        .then(data => {
          console.log(data)
          let leaderboard = JSON.parse(data)
          leaderboard.push({
            username,
            score: points
          })
          // writes the username and score into the leaderboard
          wf('leaderboard.json', JSON.stringify(leaderboard))
            .then(() => {
              mainMenu()
            })
            .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
    })
}

// function for bringing up the next question in the game
const newQuestion = () => {
  if (index < 10) {
    prompt({
      type: 'list',
      name: 'answer',
      message: questions[index].question,
      // shuffles the array so that the questions are not always displayed in the same order every time
      choices: shuffle(questions[index].incorrect_answers)
    })
      .then(({ answer }) => {
        if (answer === questions[index].correct_answer) {
          // alerts the user that they answered correctly
          console.log('correct answer!')
          // moves the user to the next question until it reaches 10 questions
          index++
          // increases the score by one point when user answers correctly
          points++
          // runs newQuestion function to move user to next question
          newQuestion()
        } else {
          // alerts user that they answered incorrectly
          console.log('incorrect answer!')
          // reveals the correct answer to the user
          console.log(`The correct answer was ${questions[index].correct_answer}`)
          // moves index up and displays the next question if index is less than 10
          index++
          newQuestion()
        }
      })
      .catch(err => console.log(err))
  } else {
    // if index reaches 10, then endGame function is triggered
    endGame()
  }
}

// function for starting new game
const newGame = () => {
  // resets index and points to zero
  index = 0
  points = 0
  // prompts user to choose a category
  prompt({
    type: 'list',
    name: 'category',
    message: 'Please choose a category.',
    choices: categories.map(category => `${category.id}: ${category.name}`)
  })
    .then(({ category }) => {
      let catId = ''
      // if-else statement to determine if the category id is a single digit or double-digit id
      if (category[1] === ':') {
        catId = category[0]
      } else {
        catId = category.substr(0, 2)
      }
      // grabs the category id from the open trivia database
      axios.get(`https://opentdb.com/api.php?amount=10&category=${catId}&type=multiple`)
        .then(({ data: { results } }) => {
          questions = results.map(question => {
            // mixes the correct answer with the incorrect answers
            question.incorrect_answers.push(question.correct_answer)
            return question
          })
          newQuestion()
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}

// function to grab categories from the api if the user chooses to play a new game
const getCategories = () => {
  if (categories.length < 1) {
    axios.get('https://opentdb.com/api_category.php')
      .then(({ data }) => {
        categories = data.trivia_categories
        newGame()
      })
      .catch(err => console.log(err))
  } else {
    newGame()
  }
}

// function to view the leaderboard which displays the usernames and scores
const viewBoard = () => {
  // reads the leaderboard and sorts the scores from highest to lowest
  rf('leaderboard.json', 'utf8')
    .then(data => {
      let leaderboard = JSON.parse(data)
      let leaderboardSorted = leaderboard.sort((a, b) => {
        b.score = a.score
      })
      leaderboardSorted.forEach(record => {
        console.log(`Username: ${record.username} | Score: ${record.score}`)
      })
      // returns user to the main menu once they are done viewing the leaderboard
      mainMenu()
    })
    .catch(err => console.log(err))
}

// function to bring up the main menu when the user enters the trivia game
const mainMenu = () => {
  prompt({
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: ['New Game', 'View Leaderboard', 'EXIT']
  })
    .then(({ action }) => {
      // switch cases to determine the function to run based on user choice
      switch (action) {
        case 'New Game':
          getCategories()
          break
        case 'View Leaderboard':
          viewBoard()
          break
        // this situation lets the user exit the terminal if they do not want to start a new game or view the leaderboard
        case 'EXIT':
          process.exit()
          break
      }
    })
    .catch(err => console.log(err))
}

// runs the main menu function once the user enters the terminal
mainMenu()
