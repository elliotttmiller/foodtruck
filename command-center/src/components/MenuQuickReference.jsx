import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { BURGER_BUILDS, LOADED_FRIES_BUILDS } from '../lib/menuGuide.js';

function RecipeCard({recipe,index}){
  return <article className="cook-recipe-card"><header><span>{String(index+1).padStart(2,'0')}</span><h3>{recipe.name}</h3></header><ul aria-label={`${recipe.name} ingredients`}>{recipe.ingredients.map((ingredient,itemIndex)=><li key={ingredient}><span>{itemIndex+1}</span><strong>{ingredient}</strong></li>)}</ul></article>;
}

function RecipeSection({id,title,subtitle,recipes}){
  return <section className="cook-guide-section" aria-labelledby={id}><div className="cook-section-heading"><div><span>BUILD GUIDE</span><h2 id={id}>{title}</h2></div><p>{subtitle}</p></div><div className={`cook-recipe-grid ${recipes.length===3?'is-three':''}`}>{recipes.map((recipe,index)=><RecipeCard recipe={recipe} index={index} key={recipe.name}/>)}</div>{title==='Smash Burgers'?<p className="cook-section-note"><strong>On request:</strong> add lettuce or tomato at no charge.</p>:null}</section>;
}

export function MenuQuickReference({onClose}){
  const dialog=useRef(null);
  const closeButton=useRef(null);
  useEffect(()=>{const previous=document.activeElement;closeButton.current?.focus();const keydown=event=>{if(event.key==='Escape'){event.preventDefault();onClose();}if(event.key==='Tab'){const controls=[...dialog.current.querySelectorAll('button:not(:disabled)')];const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}};document.addEventListener('keydown',keydown);return()=>{document.removeEventListener('keydown',keydown);previous?.focus?.();};},[onClose]);
  return <div className="order-dialog-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}><section className="menu-viewer cook-guide" role="dialog" aria-modal="true" aria-labelledby="cook-guide-title" ref={dialog}><header className="menu-viewer-head cook-guide-head"><div><span className="cook-guide-eyebrow">QUICK REFERENCE</span><h2 id="cook-guide-title">Kitchen Build Guide</h2><p>Burgers and loaded fries · ingredients shown in menu order</p></div><button ref={closeButton} type="button" className="order-dialog-x" aria-label="Close kitchen build guide" onClick={onClose}><X size={20}/></button></header><div className="cook-guide-body"><RecipeSection id="burger-builds" title="Smash Burgers" subtitle="Four menu builds" recipes={BURGER_BUILDS}/><RecipeSection id="fries-builds" title="Loaded Fries" subtitle="All builds start with fries" recipes={LOADED_FRIES_BUILDS}/></div></section></div>;
}
