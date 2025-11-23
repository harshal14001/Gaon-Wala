import './Icons.css';

const categoryIcons = [
  {
    title: "Fruits",
    image: "/src/assets/fruits-banana-svgrepo-com.svg",
    alt: "Fruits-img",
    category: "Fruit"
  },
  {
    title: "Vegies",
    image: "/src/assets/vegetables-salad-svgrepo-com.svg",
    alt: "Vegies-img",
    category: "Vegetable"
  },
  {
    title: "Milk Products",
    image: "/src/assets/milk-svgrepo-com.svg",
    alt: "Milkproducts-img",
    category: "Milk Products"
  },
  {
    title: "Plants",
    image: "/src/assets/plant-svgrepo-com.svg",
    alt: "Plants-img",
    category: "Plants"
  },
  {
    title: "Seeds",
    image: "/src/assets/coffee-grain-seed-svgrepo-com.svg",
    alt: "Seeds-img",
    category: "Seeds"
  },
  {
    title: "Sneek Peek",
    image: "/src/assets/gift-svgrepo-com.svg",
    alt: "Sneekpeek-img",
    category: "Sneek Peek"
  }
];

const Icons = ({ onCategorySelect }) => {
  return (
    <div className="icons-grid">
      {categoryIcons.map((icon, index) => (
        <div
          key={index}
          className="tile_padding"
          onClick={() => onCategorySelect(icon.category)}
          style={{ cursor: "pointer" }}
        >
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
        </div>
      ))}
    </div>
  );
};

export default Icons;