var config = {
  showMarkers: false,
  theme: "light",
  alignment: "right",
  title: "Ben Nevis in October",
  subtitle: "Climbing Britain's highest peak in Autumn 2017",
  byline: "",
  footer: "",
  chapters: [
    {
      id: "scotland",
      title: "Scotland in October.",
      image: [""],
      description: `A 4,413-foot tall collapsed volcano, Ben Nevis is Great Britain\'s highest peak 
                            (<a href="https://en.wikipedia.org/wiki/Ben_Nevis" target="_blank">Wikipedia</a>). 
                            The mountain is near the town of Fort William, at the mouth of the Rivers Lochy and Nevis. 
                            On October 23, 2017 we woke up before dawn in Edinburgh and make the drive to the base of
                            the mountain.`,
      location: {
        center: [-4.80831, 56.35052],
        zoom: 7.92,
        pitch: 9.5,
        bearing: 0.0,
      },
      onChapterEnter: [
        { layer: "route", opacity: 0 },
        { layer: "marker", opacity: 0 },
        { layer: "shelter", opacity: 0 },
      ],
      onChapterExit: [
        {
          layer: "shelter",
          opacity: 0,
        },
      ],
    },
    {
      id: "fort-william",
      title: "The Area",
      image: [
        "https://upload.wikimedia.org/wikipedia/commons/0/09/BenNevis2005.jpg",
      ],
      description: `Ben Nevis sits between Fort William and the Scottish Highlands, its western 
                        flank descending steeply to sea level over just a few miles. This photo was taken
                        from the north on a clear day - on this October day we would ascend from the 
                        southwest into the clouds.`,
      location: {
        center: [-4.94756, 56.80384],
        zoom: 10.64,
        pitch: 0.0,
        bearing: -0.18,
      },
      onChapterEnter: [
        { layer: "marker", opacity: 1 },
        { layer: "route", opacity: 0 },
      ],
      onChapterExit: [],
    },
    {
      id: "ascending",
      title: "Ascending",
      image: ["./assets/ascending.jpg"],
      description: `We began the long hike, starting to ascend almost immediately.
                            The route started heading east before wrapping around the flank 
                            of Meall an t-Suidhe, the 700m mountain next door. We hiked past Loch 
                            Meall an t-Suidhe, perched on the saddle below the flank of the main objective.`,
      location: {
        center: [-5.04203, 56.7877],
        zoom: 12.73,
        pitch: 0.0,
        bearing: 103.46,
      },
      onChapterEnter: [
        {
          layer: "route",
          opacity: 1,
        },
      ],
      onChapterExit: [
        {
          layer: "route",
          opacity: 0.3,
        },
      ],
    },
    {
      id: "summit",
      title: "The summit",
      image: ["./assets/summit-hut.jpg", "./assets/backpacks.jpg"],
      description: `After another 700m of climbing - up into the frigid clouds - we reached the 
                            summit of Britain's highest peak. The metal hut gave us some respite from the 
                            cold and wind, enough to steel ourselves for the descent.`,
      location: {
        center: [-5.00469, 56.79638],
        zoom: 16.28,
        pitch: 59.5,
        bearing: 94.4,
      },
      onChapterEnter: [
        {
          layer: "shelter",
          opacity: 0.6,
        },
      ],
      onChapterExit: [
        {
          layer: "shelter",
          opacity: 0,
        },
      ],
    },
    {
      id: "descent",
      title: "A long descent",
      image: ["./assets/descending.jpg"],
      description: `Down, down, down, the way we came up, through the floor of the cloud
                            layer, the sea suddenly visible hundreds of metres below. 
                            A well-maintained trail meant the strain was minimised - but still a major descent.`,
      location: {
        center: [-5.03447, 56.80461],
        zoom: 15.04,
        pitch: 70.0,
        bearing: 305.8,
      },
      onChapterEnter: [
        {
          layer: "shelter",
          opacity: 1,
        },
        {
          layer: "route",
          opacity: 1,
        },
      ],
      onChapterExit: [
        {
          layer: "shelter",
          opacity: 0,
        },
      ],
    },
    {
      id: "success",
      title: "Safe returns",
      image: ["./assets/summit-marker.jpg", "./assets/Ben-Nevis-3D.png"],
      description: `Back to the car by 3pm, we set off to finish the drive to the Isle of Skye. We'd explored Ben Nevis, 
                            but the mountain remained, unconquered, towering above the Scottish Highlands.`,
      location: {
        center: { lon: -5.00157, lat: 56.79651 },
        zoom: 12.58,
        pitch: 60.0,
        bearing: 2.59,
      },
      onChapterEnter: [
        {
          layer: "shelter",
          opacity: 1,
        },
        {
          layer: "route",
          opacity: 1,
        },
      ],
      onChapterExit: [
        {
          layer: "shelter",
          opacity: 0,
        },
      ],
    },
  ],
};
