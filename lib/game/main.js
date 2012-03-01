ig.module( 
	'game.main' 
)
.requires(
	'impact.game',
	'impact.background-map',
	'game.rule-set',
	'plugins.symbols.symbols',
	'plugins.impact-splash-loader',
	'impact.debug.debug'
)
.defines(function(){

GameOfDocumentedLife = ig.Game.extend({

	// don't clear the screen as we want to show the underlying CSS background
	clearColor: null,

	// world dimensions
	COLS: 40,
	ROWS: 60,
	
	// History: how many maps
	N_CELL_LAYERS: 5,
	cellMap: null,
	history: null,
	
	// an object that applies rules to a population of cells, or in our case,
	// a map representation of cell states
	ruleset: null,
	
	// a timer that fires at regular intervals and tells ruleset to do its job
	simulationTimer: null,
	stepDuration: 0.1,
	

	init: function()
	{
		// Setup app and cell state symbols
		new ig.Symbols("ALIVE DEAD");

		// Create maps
		this.createBG();
		this.createCellMaps();
	
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

	createBG: function ()
	{
		// Make a BG, something against which our cell maps will stand out
		var bgData = this.createMapData (this.COLS, this.ROWS, 2);
		var bgMap = new ig.BackgroundMap (8, bgData, new ig.Image ('media/bg.png'));
		bgMap.preRender = true;	// render once and be done with it; will save cycles
		this.backgroundMaps.push (bgMap);
	},
	
	createCellMaps: function ()
	{
		// Make top-most map
		var cellStates = this.createPopulation (this.COLS, this.ROWS, 0.15);
		this.cellMap = new ig.BackgroundMap (8, cellStates, new ig.Image ('media/states.png'));
		this.backgroundMaps.push (this.cellMap);
		
		// Make (blank) underlings
		this.history = [];
		var blankData = this.createMapData (this.COLS, this.ROWS, 0);
		for (var i=1; i<this.N_CELL_LAYERS; i++)
		{
			var map = new ig.BackgroundMap (8, blankData, new ig.Image ('media/trails.png'));
			this.backgroundMaps.push (map);
			this.history[this.history.length] = map;
		}
	},
	
	createMapData: function (cols, rows, tileIndex)
	{
		var index = (tileIndex | 0);
		var data = [];
		for (var row=0; row<rows; row++)
		{
			data[row] = [];
			for (var col=0; col<cols; col++)
				data[row][col] = index;
		}
		return data;
	},
	
	createPopulation: function (cols, rows, aliveRatio)
	{
		var pop = [];
		for (var row=0; row<rows; row++)
		{
			pop[row] = [];
			for (var col=0; col<cols; col++)
			{
				if (Math.random() < aliveRatio)
					pop[row][col] = ig.Entity.ALIVE;
				else
					pop[row][col] = ig.Entity.DEAD;
			}
		}
		return pop;
	},
	
	resetStates: function ()
	{
		// Reset top map
		this.cellMap.data = this.createPopulation (this.COLS, this.ROWS, 0.15);
		
		// Blank history
		var blankData = this.createMapData (this.COLS, this.ROWS, 0);
		for (var i=0; i<this.history.length; i++)
		{
			this.history[i].data = blankData;
		}
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
			// cycle history
			for (var i=this.history.length-1; i>0; i--)
			{
				this.history[i].data = this.history[i-1].data;
			}
			this.history[0].data = this.cellMap.data;
			
			// refresh cell map
			this.cellMap.data = this.ruleset.step (this.cellMap.data, this.cellMap.width, this.cellMap.height);
			
			// refresh history
			this.updateHistory();
			
			// next step at...
			this.simulationTimer.set (this.stepDuration);
		}
	},
	
	updateHistory: function()
	{
		// iterate over history, incrementing indices until they reach max (invisible) index
		// then, iterate over present (cellMap) data, setting history indices to 1
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
			this.resetStates();
	},

	draw: function()
	{
		ig.system.context.clearRect (0 ,0, ig.system.realWidth, ig.system.realHeight);
		this.parent();
	},
});


// Start the Game with 30fps, a resolution of 320x480, unscaled, and use splash loader plugin
ig.main ('#canvas', GameOfDocumentedLife, 30, 320, 480, 1, ig.ImpactSplashLoader);

});
