// function that parses gpt output into array of strings to say
function parseMeditationInput(inputStr) {
    const lines = inputStr.trim().split('\n');
    const result = [];
    const lineRegex = /^(\d+)\/(\d+):\s*(.+?)\s*(\[(?:PAUSE\s*)*\])?$/i;
    for (const line of lines) {
      const match = line.match(lineRegex);
      if (match) {
        const text = match[3].trim();
        result.push(text);
      } else {
        console.warn(`Skipping invalid line: "${line}"`);
      }
    }
    return result;
  }
  

// function that calculates pause time based on array of meditation strings
//      and total requested time
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


    //get length of the array, that represents minutes
    speakingTime = totalCharacters / charspersec / 60;  //15 chars per second
    
    if (speakingTime >= meditationTime) //if estmating long reading, make sure to add more time for pauses
    {
       
        meditationTime += 2; //add 2 mins. Maybe this should increase at a rate based off ratio?
    }

    pauseTime = meditationTime - speakingTime; //total pause time
//     pauseTime /= meditationTime ; //each pause is how long??




    return pauseTime; //total time spend pausing in minutes
}  module.exports = { parseMeditationInput, getPauseLength };