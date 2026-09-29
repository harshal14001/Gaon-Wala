import { Link } from 'react-router-dom';
import { CATEGORY_TO_SLUG } from '../constants/categories.js';
import './Icons.css';

import fruitsImg from "../assets/fruits-banana-svgrepo-com.svg";
import vegiesImg from "../assets/vegetables-salad-svgrepo-com.svg";
import milkImg from "../assets/milk-svgrepo-com.svg";
import plantsImg from "../assets/plant-svgrepo-com.svg";
import seedsImg from "../assets/coffee-grain-seed-svgrepo-com.svg";
import giftImg from "../assets/gift-svgrepo-com.svg";

const categoryIcons = [
  { title: "Fruits",        image: fruitsImg, alt: "Fruits",        category: "Fruit"         },
  { title: "Vegies",        image: vegiesImg, alt: "Vegetables",    category: "Vegetable"     },
  { title: "Milk Products", image: milkImg,   alt: "Milk Products", category: "Milk Products" },
  { title: "Plants",        image: plantsImg, alt: "Plants",        category: "Plants"        },
  { title: "Seeds",         image: seedsImg,  alt: "Seeds",         category: "Seeds"         },
  { title: "Sneek Peek",    image: giftImg,   alt: "Sneek Peek",    category: "Other"         },
];


// const categoryIcons = [
//   { title: "Fruits",        image: "/src/assets/fruits-banana-svgrepo-com.svg",     alt: "Fruits",        category: "Fruit"         },
//   { title: "Vegies",        image: "/src/assets/vegetables-salad-svgrepo-com.svg",  alt: "Vegetables",    category: "Vegetable"     },
//   { title: "Milk Products", image: "/src/assets/milk-svgrepo-com.svg",              alt: "Milk Products", category: "Milk Products" },
//   { title: "Plants",        image: "/src/assets/plant-svgrepo-com.svg",             alt: "Plants",        category: "Plants"        },
//   { title: "Seeds",         image: "/src/assets/coffee-grain-seed-svgrepo-com.svg", alt: "Seeds",         category: "Seeds"         },
//   { title: "Sneek Peek",    image: "/src/assets/gift-svgrepo-com.svg",              alt: "Sneek Peek",    category: "Other"         },
// ];

const Icons = ({ selectedCategory }) => {
  const hasActive = selectedCategory && selectedCategory !== "all";

  return (
    <div className={`icons-grid ${hasActive ? "has-active" : ""}`}>
      {categoryIcons.map((icon) => {
        const slug     = CATEGORY_TO_SLUG[icon.category];
        const isActive = selectedCategory === icon.category;

        return (
          <Link
            key={icon.category}
            to={isActive ? "/" : `/${slug}`}
            className={`tile_padding ${isActive ? "tile_active" : ""}`}
            aria-label={`${isActive ? "Deselect" : "Filter by"} ${icon.title}`}
          >
            <img
              loading="lazy"
              className="logo-list__image"
              width="70"
              height="70"
              src={icon.image}
              alt={icon.alt}
            />
            <p className="icon-title">{icon.title}</p>
          </Link>
        );
      })}
    </div>
  );
};

export default Icons;
