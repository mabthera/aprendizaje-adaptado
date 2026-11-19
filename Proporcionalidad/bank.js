/* Banco parametrizado de proporcionalidad. Sin sincronización externa. */
(function (root) {
  'use strict';
  const STAGES = [null,
    { title:'Proporcionalidad directa', short:'Directa', color:'#C34755', min:4, max:9, early:4, essential:['d1','d2','d3','d4'], exit:['d1','d2'], need:2, required:['d1','d2'], requiredCoverage:true, families:['directa'] },
    { title:'Proporcionalidad inversa', short:'Inversa', color:'#4F6ED0', min:4, max:9, early:4, essential:['i1','i2','i3','i4'], exit:['i1','i2'], need:2, required:['i1','i2'], requiredCoverage:true, families:['inversa'] },
    { title:'Proporcionalidad compuesta', short:'Compuesta', color:'#14765F', min:4, max:9, early:4, essential:['c1','c2','c3','c4'], exit:['c1','c2'], need:2, required:['c1','c2'], requiredCoverage:true, families:['compuesta'] },
    { title:'Clasifica y resuelve', short:'Mixta', color:'#8B590D', min:12, max:24, early:12, essential:['md1','md2','md3','md4','mi1','mi2','mi3','mi4','mc1','mc2','mc3','mc4'], exit:['md2','mi2','mc2'], need:2, mixed:true, families:['directa','inversa','compuesta'] }
  ];
  const LABELS={d1:'Escalar una receta',d2:'Calcular un precio proporcional',d3:'Interpretar una escala',d4:'Hallar la cantidad correspondiente',i1:'Relacionar trabajadores y duración',i2:'Relacionar velocidad y tiempo',i3:'Calcular el tiempo según el número de grifos',i4:'Hallar cuántos trabajadores se necesitan',c1:'Calcular producción según personas y horas',c2:'Relacionar trabajadores, tiempo y tamaño de tarea',c3:'Calcular consumo según máquinas y horas',c4:'Comparar dos planes de trabajo',md1:'Clasificar una receta escalada',md2:'Clasificar un precio proporcional',md3:'Clasificar una escala',md4:'Clasificar un consumo proporcional',mi1:'Clasificar trabajadores y duración',mi2:'Clasificar velocidad y tiempo',mi3:'Clasificar grifos y llenado',mi4:'Clasificar máquinas y duración',mc1:'Clasificar producción por personas y horas',mc2:'Clasificar trabajadores y tarea ampliada',mc3:'Clasificar consumo de máquinas',mc4:'Clasificar planes con personas, días y horas'};
  const rand=(r,a,b)=>a+Math.floor(r()*(b-a+1));
  const q=(t,p,text,answer,explanation,hint,model)=>({id:t.id,stage:t.stage,family:t.family,b:t.b,params:p,text,answer:String(answer),kind:'rat',signature:`${t.id}|${JSON.stringify(p)}`,explanation,hint,model:model||null});
  const templates=[];
  function add(stage,id,family,b,make){templates.push({stage,id,family,b,make(rng=Math.random){return make(this,rng)}})}
  // Directa: la razón entre las magnitudes se conserva.
  const direct=(t,r,kind)=>{let a,b,k,n,txt,ans,ex;
    if(kind===1){a=rand(r,2,9);b=rand(r,40,160)*5; k=rand(r,2,5); n=a*k; txt=`Una receta para ${a} personas necesita ${b} g de harina. ¿Cuántos gramos hacen falta para ${n} personas?`;ans=b*k;ex=`Las dos cantidades cambian en el mismo factor: ${n} ÷ ${a} = ${k}. Entonces ${b} × ${k} = ${ans} g.`}
    else if(kind===2){a=rand(r,2,9);b=rand(r,3,16); k=rand(r,2,5); n=a*k; txt=`${a} cuadernos cuestan ${b} €. ¿Cuánto cuestan ${n} cuadernos al mismo precio por unidad?`;ans=b*k;ex=`${n} cuadernos son ${k} grupos de ${a}. El precio también se multiplica por ${k}: ${b} × ${k} = ${ans} €.`}
    else if(kind===3){a=rand(r,2,8);b=rand(r,3,14); k=rand(r,2,5); n=a*k; txt=`En un plano, ${a} cm representan ${b} km. ¿Cuántos kilómetros representan ${n} cm?`;ans=b*k;ex=`${n} cm es ${k} veces ${a} cm. La distancia real también se multiplica por ${k}: ${b} × ${k} = ${ans} km.`}
    else {a=rand(r,2,9);b=a*rand(r,50,140);k=rand(r,2,5);n=b*k;txt=`Una receta usa ${b} g de ingrediente para ${a} personas. ¿Para cuántas personas alcanza ${n} g?`;ans=a*k;ex=`La cantidad de ingrediente aumenta por ${k}, así que las personas también: ${a} × ${k} = ${ans}.`}
    return q(t,{kind,a,b,k},txt,ans,ex,'Comprueba si al multiplicar una magnitud por un factor la otra cambia por ese mismo factor.');};
  add(1,'d1','directa',-0.7,(t,r)=>direct(t,r,1)); add(1,'d2','directa',0,(t,r)=>direct(t,r,2)); add(1,'d3','directa',0.5,(t,r)=>direct(t,r,3)); add(1,'d4','directa',1,(t,r)=>direct(t,r,4));
  // Inversa: para una tarea fija, el producto de las magnitudes permanece constante.
  const inverse=(t,r,kind)=>{let a,b,k,n,txt,ans,ex;
    if(kind===1){a=rand(r,3,12);b=rand(r,4,20);k=rand(r,2,5);n=a*k;ans=b/k; if(!Number.isInteger(ans)){b*=k;ans=b/k} txt=`${a} trabajadores tardan ${b} días en terminar una tarea. ¿Cuántos días tardan ${n} trabajadores al mismo ritmo?`;ex=`La tarea es la misma: trabajadores × días se conserva. ${a} × ${b} = ${n} × ${ans} días.`}
    else if(kind===2){a=rand(r,40,80);b=rand(r,3,8);k=rand(r,2,5);let speed=a*k;ans=b/k;if(!Number.isInteger(ans)){b*=k;ans=b/k} txt=`Un trayecto lleva ${b} h a ${a} km/h. ¿Cuántas horas lleva a ${speed} km/h?`;ex=`La distancia no cambia: ${a} × ${b} = ${speed} × ${ans}.`}
    else if(kind===3){a=rand(r,2,10);b=rand(r,6,25);k=rand(r,2,5);let nTaps=a*k;ans=b/k;if(!Number.isInteger(ans)){b*=k;ans=b/k}txt=`${a} grifos iguales llenan un depósito en ${b} h. ¿Cuánto tardan ${nTaps} grifos?`;ex=`Al aumentar los grifos por ${k}, el tiempo se divide por ${k}: ${b} ÷ ${k} = ${ans} h.`}
    else{a=rand(r,4,20);b=rand(r,3,15);k=rand(r,2,5);n=b*k;ans=a/k;if(!Number.isInteger(ans)){a*=k;ans=a/k}txt=`${a} máquinas completan un lote en ${b} h. ¿Cuántas máquinas hacen falta para terminarlo en ${n} h?`;ex=`Máquinas × horas es constante: ${a} × ${b} = ${n} × ${ans}.`}
    return q(t,{kind,a,b,k},txt,ans,ex,'La tarea o distancia permanece fija. Si una magnitud aumenta, ¿qué debe pasar con la otra?');};
  add(2,'i1','inversa',-0.7,(t,r)=>inverse(t,r,1)); add(2,'i2','inversa',0,(t,r)=>inverse(t,r,2)); add(2,'i3','inversa',0.5,(t,r)=>inverse(t,r,3)); add(2,'i4','inversa',1,(t,r)=>inverse(t,r,4));
  // Compuesta: variar una magnitud cada vez y combinar los factores directos e inversos.
  const compound=(t,r,kind)=>{let p={kind};let text,answer,ex;
    if(kind===1){let people=rand(r,2,6),hours=rand(r,2,5),units=rand(r,12,60)*10, kp=rand(r,2,4),kh=rand(r,2,4);p={kind,people,hours,units,kp,kh};answer=units*kp*kh;text=`${people} personas trabajan ${hours} h y fabrican ${units} piezas. ¿Cuántas piezas fabrican ${people*kp} personas en ${hours*kh} h al mismo ritmo?`;ex=`La producción es directa respecto a personas y horas: ${units} × ${kp} × ${kh} = ${answer} piezas.`}
    else if(kind===2){let people=rand(r,2,10),days=rand(r,3,14),factor=rand(r,2,5),kp=rand(r,2,5);while((days*factor)%kp!==0)days++;p={kind,people,days,factor,kp};answer=days*factor/kp;text=`${people} personas tardan ${days} días en completar una tarea. ¿Cuántos días tardan ${people*kp} personas en una tarea ${factor} veces mayor?`;ex=`La tarea mayor multiplica el tiempo por ${factor}; más personas lo dividen por ${kp}: ${days} × ${factor} ÷ ${kp} = ${answer} días.`}
    else if(kind===3){let machines=rand(r,2,6),hours=rand(r,2,6),litres=rand(r,12,40)*5,k1=rand(r,2,3),k2=rand(r,2,3);p={kind,machines,hours,litres,k1,k2};answer=litres*k1*k2;text=`${machines} máquinas consumen ${litres} L en ${hours} h. ¿Cuánto consumen ${machines*k1} máquinas en ${hours*k2} h?`;ex=`El consumo aumenta en la misma proporción que máquinas y horas: ${litres} × ${k1} × ${k2} = ${answer} L.`}
    else {let workers=rand(r,2,5),daily=rand(r,4,8),kw=rand(r,2,4),kh=rand(r,2,3),task=rand(r,2,4),days=kw*kh*rand(r,1,3);let total=workers*days*daily;answer=total*task/(workers*kw*daily*kh);p={kind,workers,days,daily,kw,kh,task};text=`${workers} personas, trabajando ${daily} h al día durante ${days} días, hacen una tarea. ¿Cuántos días necesitan ${workers*kw} personas que trabajan ${daily*kh} h al día para una tarea ${task} veces mayor?`;ex=`La tarea multiplica el trabajo por ${task}; personas por ${kw} y horas diarias por ${kh} lo dividen: ${days} × ${task} ÷ ${kw} ÷ ${kh} = ${answer} días.`}
    return q(t,p,text,answer,ex,'Compara una magnitud cada vez con la incógnita: decide si el efecto es directo o inverso y combina los factores.');};
  add(3,'c1','compuesta',-0.7,(t,r)=>compound(t,r,1)); add(3,'c2','compuesta',0,(t,r)=>compound(t,r,2)); add(3,'c3','compuesta',0.5,(t,r)=>compound(t,r,3)); add(3,'c4','compuesta',1,(t,r)=>compound(t,r,4));
  // Integración: cuatro contextos distintos por modelo. El selector elige primero el modelo (paso) y luego se corrige el resultado.
  const mixedMake=(type,kind)=>(t,r)=>{let item;
    if(type==='directa') item=direct(t,r,kind);
    if(type==='inversa') item=inverse(t,r,kind);
    if(type==='compuesta') item=compound(t,r,kind);
    item.id=t.id;item.stage=t.stage;item.family=t.family;item.b=t.b;item.signature=`${t.id}|${JSON.stringify(item.params)}`;item.model=type;
    item.step={prompt:'¿Qué tipo de proporcionalidad relaciona las magnitudes?',options:['Directa','Inversa','Compuesta'],answer:type[0].toUpperCase()+type.slice(1)};
    item.hint='Fíjate en qué magnitudes cambian y cómo se relacionan con la incógnita. Después calcula.';
    return item;
  };
  const mixedConsumption=(t,r)=>{const amount=rand(r,2,12),days=rand(r,4,18),k=rand(r,2,6);const item=q(t,{kind:4,amount,days,k},`${amount} kg de pienso duran ${days} días. ¿Cuánto duran ${amount*k} kg al mismo ritmo?`,days*k,`La cantidad de pienso se multiplica por ${k}; el tiempo también: ${days} × ${k} = ${days*k} días.`,'Comprueba cuántas veces cambia la cantidad de pienso. El tiempo cambia por el mismo factor.','directa');item.step={prompt:'¿Qué tipo de proporcionalidad relaciona las magnitudes?',options:['Directa','Inversa','Compuesta'],answer:'Directa'};item.hint='Fíjate en qué magnitudes cambian y cómo se relacionan con la incógnita. Después calcula.';return item;};
  [['md1','directa',1,-0.7],['md2','directa',2,0],['md3','directa',3,0.5],['mi1','inversa',1,-0.7],['mi2','inversa',2,0],['mi3','inversa',3,0.5],['mi4','inversa',4,1],['mc1','compuesta',1,-0.7],['mc2','compuesta',2,0],['mc3','compuesta',3,0.5],['mc4','compuesta',4,1]].forEach(([id,family,kind,b])=>add(4,id,family,b,mixedMake(family,kind)));
  add(4,'md4','directa',1,mixedConsumption);
  function make(id,rng=Math.random){const t=templates.find(x=>x.id===id);if(!t)throw Error(`Plantilla desconocida: ${id}`);return t.make(rng)}
  const api={STAGES,LABELS,templates,make,templatesFor:n=>templates.filter(t=>t.stage===n)};
  root.ProportionBank=api;
  if(typeof module!=='undefined')module.exports=api;
})(globalThis);

