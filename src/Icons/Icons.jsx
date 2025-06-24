import './Icons.css'

const categoryIcons = [
  {
    title: "Fruits",
    image: "/src/assets/Fruits-png-effect.png",
    // link: "/src/assets/Fruits-png-effect.png",
    alt: "Fruits-img"
  },
  {
    title: "Milk Products",
    image: "/src/assets/milk-svgrepo-com.svg",
    // link: "/src/assets/milk-svgrepo-com.svg",
    alt: "Milkproducts-img"
  },
  {
    title: "Plants",
    image: "/src/assets/plant-svgrepo-com.svg",
    // link: "/src/assets/plant-svgrepo-com.svg",
    alt: "Plants-img"
  },
  {
    title: "Seeds",
    image: "/src/assets/coffee-grain-seed-svgrepo-com.svg",
    // link: "/src/assets/seeds-svgrepo-com.svg",
    alt: "Seeds-img"
  }
];

const Icons = () => {
  return (
    <div className="icons-grid">
      {categoryIcons.map((icon, index) => (
        <a key={index} href={icon.link} className="tile_padding">
          <div className="tile_padding">
            <img
              loading="lazy"
              sizes="420px"
              className="logo-list__image"
              width="125"
              height="125"
              src={icon.image}
              alt={icon.alt}
            />
          </div>
          <p className="icon-title">{icon.title}</p>
        </a>
      ))}
    </div>
  );
};

export default Icons;
