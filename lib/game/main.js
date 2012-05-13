ig.module( 
	'game.main' 
)
.requires(
	'impact.game',
	'impact.background-map',
	'game.rule-set',
	'plugins.symbols.symbols',
	'plugins.outlinedfont',
	'plugins.impact-splash-loader'
	//'impact.debug.debug'
)
.defines(function(){

GameOfDocumentedLife = ig.Game.extend({

	// don't clear the screen as we want to show the underlying CSS background
	clearColor: null,

	// world dimensions and stats
	COLS: 40,
	ROWS: 60,
	FIRST_GEN_ALIVE: 0.15,
	
	// Tile sets and key values
	bgTiles: 'media/bg.png',
	BG_TILE_INDEX: 2,
	statesTiles: 'media/states-2.png',
	LAST_CELL_TILE_INDEX: 6,
	
	// Maps
	states: null,

	// an object that applies rules to a population of cells, or in our case,
	// a map representation of cell states
	ruleset: null,
	
	// a timer that fires at regular intervals and tells ruleset to do its job
	simulationTimer: null,
	stepDuration: 0.1,
	
	// Instructions
	//font: new ig.Font( 'media/04b03-black.font.png' ),
	font: new OutlinedFont('media/outlinedfont.png', 1),

	init: function()
	{
		// Setup app and cell state symbols
		new ig.Symbols("ALIVE DEAD");

		// Create maps
		this.initBG();
		this.initStates();
	
		// RuleSet will await our next call to step
		this.ruleset = new RuleSetConway1 ();
		
		// Setup sim timer
		this.simulationTimer = new ig.Timer();

		// Handle mouse and keyboard events
		ig.input.bind(ig.KEY._1, '1');
		ig.input.bind(ig.KEY._2, '2');
		ig.input.bind(ig.KEY._3, '3');
		ig.input.bind(ig.KEY._4, '4');
		ig.input.bind(ig.KEY._5, '5');
		ig.input.bind(ig.KEY.MOUSE1, 'mouse1');
	},

	initBG: function ()
	{
		// Make a BG, something against which our cell maps will stand out
		var data = this.createData (this.COLS, this.ROWS, this.BG_TILE_INDEX);
		var bgMap = new ig.BackgroundMap (8, data, new ig.Image (this.bgTiles));
		bgMap.preRender = true;	// render once and be done with it; will save cycles
		this.backgroundMaps.push (bgMap);
	},
	
	initStates: function ()
	{
		var data = this.createData (this.COLS, this.ROWS, ig.Entity.DEAD);
		this.randomFill (data, this.COLS, this.ROWS, this.FIRST_GEN_ALIVE, ig.Entity.ALIVE);
		this.states = new ig.BackgroundMap (8, data, new ig.Image (this.statesTiles));
		this.backgroundMaps.push (this.states);
	},

	createData: function (cols, rows, value)
	{
		var data = [];
		for (var row=0; row<rows; row++)
		{
			data[row] = [];
			for (var col=0; col<cols; col++)
				data[row][col] = value;
		}
		return data;
	},
	
	randomFill: function (data, cols, rows, probability, value)
	{
		for (var row=0; row<rows; row++)
		{
			for (var col=0; col<cols; col++)
			{
				if (Math.random() < probability)
					data[row][col] = value;
			}
		}
	},
	
	reset: function ()
	{
		// reset states
		var data = this.createData (this.COLS, this.ROWS, ig.Entity.DEAD);
		this.randomFill (data, this.COLS, this.ROWS, this.FIRST_GEN_ALIVE, ig.Entity.ALIVE);
		this.states.data = data;
	},

	update: function ()
	{
		this.updateSimulation();
		this.handleKeys();
		this.handleMouse();
		this.parent ();
	},
	
	updateSimulation: function ()
	{
		if (this.simulationTimer.delta() > 0 && this.stepDuration > 0)
		{
			// next states
			var nextStates = this.ruleset.step (this.states.data, this.states.width, this.states.height);

			// iterate, update states
			for (var row=0; row<this.ROWS; row++)
			{
				for (var col=0; col<this.COLS; col++)
				{
					var state = this.states.data[row][col];
					var nextState = nextStates[row][col];

					if (nextState == ig.Entity.DEAD && state == ig.Entity.ALIVE)
					{
						this.states.data[row][col] = ig.Entity.DEAD;
					}
					else if (nextState == ig.Entity.ALIVE && state >= ig.Entity.DEAD)
					{
						this.states.data[row][col] = ig.Entity.ALIVE;
					}
					else if (state >= ig.Entity.DEAD && state < this.LAST_CELL_TILE_INDEX)
					{
						this.states.data[row][col] = state + 1;
					}
				}
			}

			// next step at...
			this.simulationTimer.set (this.stepDuration);
		}
	},
	
	handleKeys: function()
	{
		if (ig.input.pressed('1'))
			this.stepDuration = 1;
		else if (ig.input.pressed('2'))
			this.stepDuration = 0.5;
		else if (ig.input.pressed('3'))
			this.stepDuration = 0.25;
		else if (ig.input.pressed('4'))
			this.stepDuration = 0.1;
		else if (ig.input.pressed('5'))
			this.stepDuration = 0.05;
	},
	
	handleMouse: function ()
	{
		if (ig.input.released("mouse1"))
			this.reset ();
	},

	draw: function()
	{
		ig.system.context.clearRect (0 ,0, ig.system.realWidth, ig.system.realHeight);
		this.parent();
		this.font.draw ('MOUSE: RESET     1-5: SPEED', ig.system.width/2, 5, ig.Font.ALIGN.CENTER);
	},
});


// Start the Game with 30fps, a resolution of 320x480, unscaled, and use splash loader plugin
ig.main ('#canvas', GameOfDocumentedLife, 30, 320, 480, 1, ig.ImpactSplashLoader);

});
