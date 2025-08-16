#!/usr/bin/env node
const mineflayer = require('mineflayer');
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const { Movements, goals: { GoalFollow } } = require('mineflayer-pathfinder');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration object
const config = {
  host: 'gold.magmanode.com',
  port: 27218,
  username: 'PersianGuard',
  owner: 'parhamEpex085',
  version: '1.19.4',
  isConfigured: false
};

// Constants
const PASSWORD = '2511';
const FOLLOW_DISTANCE = 3;
const ATTACK_RANGE = 5;
const RECONNECT_DELAY = 5000;

// Main menu
function showMenu() {
  console.log('\n=== Bot Configuration Menu ===');
  console.log('1. Set bot username');
  console.log('2. Set owner username');
  console.log('3. Set server IP');
  console.log('4. Set server port');
  console.log('5. Start bot');
  console.log('0. Exit');
}

// Password authentication
function askPassword() {
  console.log('\n=== Authentication Required ===');
  rl.question('Please enter password: ', (input) => {
    if (input === PASSWORD) {
      console.log('✓ Password correct!');
      mainMenu();
    } else {
      console.log('✗ Wrong password!');
      askPassword();
    }
  });
}

// Handle menu choices
function mainMenu() {
  showMenu();
  rl.question('\nSelect an option: ', (choice) => {
    switch (choice) {
      case '1':
        rl.question('Enter new bot username: ', (name) => {
          config.username = name;
          console.log(`Bot username set to: ${name}`);
          mainMenu();
        });
        break;
      
      case '2':
        rl.question('Enter owner username: ', (owner) => {
          config.owner = owner;
          console.log(`Owner set to: ${owner}`);
          mainMenu();
        });
        break;
      
      case '3':
        rl.question('Enter server IP: ', (ip) => {
          config.host = ip;
          console.log(`Server IP set to: ${ip}`);
          mainMenu();
        });
        break;
      
      case '4':
        rl.question('Enter server port: ', (port) => {
          config.port = parseInt(port);
          console.log(`Server port set to: ${port}`);
          mainMenu();
        });
        break;
      
      case '5':
        if (!config.host || !config.port || !config.username || !config.owner) {
          console.log('✗ Please complete all configurations first!');
          mainMenu();
        } else {
          config.isConfigured = true;
          startBot();
        }
        break;
      
      case '0':
        console.log('Exiting...');
        rl.close();
        process.exit(0);
        break;
      
      default:
        console.log('✗ Invalid option!');
        mainMenu();
    }
  });
}

// Start the bot
function startBot() {
  console.log('\n=== Starting Minecraft Bot ===');
  console.log(`Username: ${config.username}`);
  console.log(`Owner: ${config.owner}`);
  console.log(`Server: ${config.host}:${config.port}`);

  const bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    version: config.version,
    auth: 'offline'
  });

  // Load pathfinder plugin
  bot.loadPlugin(pathfinder);
  let movements;
  let isFollowing = false;

  bot.once('spawn', () => {
    console.log('✓ Bot successfully connected to server!');
    movements = new Movements(bot);
    movements.allow1by1towers = true;
    movements.canDig = false;
    bot.pathfinder.setMovements(movements);
    bot.chat(`Guard bot ${config.owner} ready!`);
    
    if (bot.inventory.items().length === 0) {
      bot.chat('Warning: I have no weapons!');
    }
  });

  // Attack nearby mobs
  function attackNearbyMobs() {
    const mobs = ['zombie', 'skeleton', 'spider', 'creeper', 'enderman'];
    const target = bot.nearestEntity(entity => {
      return mobs.includes(entity.name) && 
             entity.position.distanceTo(bot.entity.position) < ATTACK_RANGE;
    });
    
    if (target) {
      bot.attack(target);
      bot.lookAt(target.position);
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
    }
  }

  // Drop all items
  function dropAllItems() {
    const items = bot.inventory.items();
    if (items.length === 0) {
      bot.chat('I have no items to drop!');
      return;
    }

    items.forEach(item => {
      try {
        bot.toss(item.type, null, item.count);
        bot.chat(`Dropped: ${item.name} (${item.count})`);
      } catch (err) {
        bot.chat(`Error dropping ${item.name}: ${err.message}`);
      }
    });
  }

  // Guard owner function
  function guardOwner() {
    const owner = bot.players[config.owner]?.entity;
    if (!owner) {
      bot.chat("I can't find the owner!");
      return;
    }

    if (owner.position.distanceTo(bot.entity.position) > FOLLOW_DISTANCE) {
      bot.pathfinder.setGoal(new GoalFollow(owner, FOLLOW_DISTANCE), true);
    }

    attackNearbyMobs();
  }

  // Main guard interval
  const guardInterval = setInterval(() => {
    if (isFollowing) guardOwner();
  }, 1000);

  // Chat commands
  bot.on('chat', (username, message) => {
    if (username !== config.owner) return;

    switch (message.toLowerCase()) {
      case 'follow':
        isFollowing = true;
        bot.chat('Following mode activated!');
        break;
        
      case 'stop':
        isFollowing = false;
        bot.pathfinder.stop();
        bot.chat('Following mode deactivated');
        break;
        
      case 'drop':
        dropAllItems();
        break;
        
      case 'items':
        const items = bot.inventory.items();
        if (items.length > 0) {
          bot.chat('My items: ' + items.map(i => `${i.name} (${i.count})`).join(', '));
        } else {
          bot.chat('I have no items!');
        }
        break;
        
      case 'home set':
        bot.chat('/sethome');
        break;
        
      case 'go home':
        bot.chat('/home');
        break;
    }
  });

  // Error handling
  bot.on('error', err => {
    console.log('Error:', err.message);
    setTimeout(() => bot.connect(), RECONNECT_DELAY);
  });

  bot.on('end', () => {
    clearInterval(guardInterval);
    console.log('Disconnected, reconnecting...');
    setTimeout(() => bot.connect(), RECONNECT_DELAY);
  });

  // Keep process running
  process.on('SIGINT', () => {
    console.log('Shutting down bot...');
    bot.quit();
    process.exit();
  });
}

// Start the application
console.clear();
console.log('=== Minecraft Guard Bot ===');
askPassword();
