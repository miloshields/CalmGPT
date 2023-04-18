const fs = require('fs');
let fileContents;

function parseMeditationInput(inputStr) {
    const blocks = inputStr.split('\n\n');
    const result = [];
    for (const block of blocks) {
      const lines = block.split('\n');
      const text = lines[lines.length - 1].replace(/^\d+\/\d+: /, '').trim();
      result.push(text);
    }
    return result;
  }

  function getPauseLength(meditationStrings, meditationTime) 
{
    const charspersec = 15 //my estimate
    

    //round out the data
    if (meditationTime < 3 )
    {
        meditationTime = 3;
    }
    
    if (meditationTime > 15 )
    {
        meditationTime = 15;
    }

    //assert that length of array equals the time maybe?
    const totalCharacters = meditationStrings.reduce((accumulator, currentValue) => accumulator + currentValue.length, 0);

    console.log("Total chars / meditation time :" +  totalCharacters + "/" + meditationTime  + "\n");

    //get length of the array, that represents minutes
    speakingTime = totalCharacters / charspersec / 60;  //15 chars per second
    
    if (speakingTime >= meditationTime) //if estmating long reading, make sure to add more time for pauses
    {
       
        meditationTime += 2; //add 2 mins. Maybe this should increase at a rate based off ratio?
        console.log("Adding more time " +  totalCharacters + "/" + meditationTime  + "\n");
    }

    pauseTime = meditationTime - speakingTime; //total pause time
    pauseTime /= meditationTime ; //each pause is how long??

    console.log("Each pause is  " +  totalCharacters + "/" + meditationTime  + "\n");



    return Math.floor(pauseTime*60); //length of each pause (total pause / num of blocks)
}


fs.readFile('exampleoutput.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log("Hello!")
  fileContents = data;
  console.log(fileContents);
  const result = parseMeditationInput(fileContents);
  const pauseTime = getPauseLength(result, 15);
  console.log("Pause length is "+pauseTime);
});

// Access the fileContents variable outside of the callback function

