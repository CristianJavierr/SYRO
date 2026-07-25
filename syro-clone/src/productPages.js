const whatsappNumber = "18496586057";

export const productPages = {
  "syro-pos": {
    slug: "syro-pos",
    number: "01",
    name: "SYRO POS",
    kicker: "Punto de venta",
    lead: "Vende, factura y controla tu negocio desde un solo lugar.",
    statement: "Una caja rápida por fuera. Un sistema completo por dentro.",
    description:
      "SYRO POS reúne ventas, productos, inventario y facturación en una experiencia clara para que tu equipo pueda operar con menos pasos y más control.",
    image: "/assets/pos_desktop.jpeg",
    logo: "/assets/Frame 34.png",
    imageAlt: "SYRO POS funcionando en una tableta",
    imagePosition: "center",
    highlights: ["Ventas ágiles", "Inventario conectado", "Facturación electrónica"],
    capabilities: [
      {
        number: "01",
        title: "Caja sin fricción",
        copy: "Encuentra productos, arma la venta y registra el pago desde una interfaz diseñada para el ritmo real de tu negocio.",
      },
      {
        number: "02",
        title: "Inventario al día",
        copy: "Cada movimiento de venta mantiene tus existencias organizadas para que sepas qué tienes y qué necesitas reponer.",
      },
      {
        number: "03",
        title: "Todo conectado",
        copy: "Centraliza productos, suplidores, equipo y facturación para reducir tareas duplicadas y decisiones a ciegas.",
      },
    ],
    closing: "Convierte cada venta en información útil para tu próxima decisión.",
    next: "cuadernito",
  },
  cuadernito: {
    slug: "cuadernito",
    number: "02",
    name: "Cuadernito",
    kicker: "Control para colmados",
    lead: "Tus cuentas claras, tus cobros cerca y tu negocio siempre en orden.",
    statement: "El cuaderno de siempre, convertido en una herramienta para crecer.",
    description:
      "Cuadernito simplifica el control diario de colmados y comercios: registra cuentas, consulta balances, imprime facturas y trabaja con códigos de barras sin complicaciones.",
    image: "/assets/cuadernito_desktop.jpeg",
    logo: "/assets/Frame 35.png",
    imageAlt: "Cuadernito mostrando el control de cuentas en un teléfono",
    imagePosition: "center 42%",
    highlights: ["Cuentas organizadas", "Cobros visibles", "Operación sencilla"],
    capabilities: [
      {
        number: "01",
        title: "Cuentas bajo control",
        copy: "Consulta quién debe, cuánto debe y los movimientos recientes sin depender de hojas sueltas o cálculos manuales.",
      },
      {
        number: "02",
        title: "Facturas al instante",
        copy: "Registra cada operación y entrega comprobantes de manera rápida para mantener un historial claro del negocio.",
      },
      {
        number: "03",
        title: "Hecho para el día a día",
        copy: "Una experiencia directa, legible y fácil de adoptar por cualquier persona del equipo desde el primer uso.",
      },
    ],
    closing: "Menos tiempo cuadrando cuentas. Más tiempo atendiendo tu negocio.",
    next: "syro-erp",
  },
  "syro-erp": {
    slug: "syro-erp",
    number: "03",
    name: "SYRO ERP",
    kicker: "Gestión empresarial",
    lead: "Toda la operación de tu empresa, convertida en una sola fuente de verdad.",
    statement: "Control profundo sin perder claridad.",
    description:
      "SYRO ERP integra inventario, operaciones y análisis en una plataforma que ayuda a equipos en crecimiento a visualizar su negocio y actuar con información confiable.",
    image: "/assets/erp_desktop.jpeg",
    logo: "/assets/Frame 36.png",
    imageAlt: "Panel de analítica y gestión de SYRO ERP",
    imagePosition: "center",
    highlights: ["Datos centralizados", "Procesos escalables", "Visibilidad operativa"],
    capabilities: [
      {
        number: "01",
        title: "Operación centralizada",
        copy: "Reúne la información crítica de inventario y gestión para que las áreas trabajen sobre los mismos datos.",
      },
      {
        number: "02",
        title: "Decisiones visibles",
        copy: "Transforma actividad diaria en paneles y reportes que permiten detectar cambios, prioridades y oportunidades.",
      },
      {
        number: "03",
        title: "Escala a tu ritmo",
        copy: "Una base flexible para constructoras, restaurantes y empresas que necesitan sumar procesos sin perder control.",
      },
    ],
    closing: "Una plataforma preparada para la complejidad que viene con crecer.",
    next: "syro-pos",
  },
};

const createWhatsappUrl = (productName) => {
  const message = encodeURIComponent(
    `Hola, me interesa conocer más sobre ${productName} de SYRO.`
  );
  return `https://wa.me/${whatsappNumber}?text=${message}`;
};

const productNavigation = (activeSlug) =>
  Object.values(productPages)
    .map(
      (product) => `
        <a
          class="product-switcher__link${product.slug === activeSlug ? " is-active" : ""}"
          href="/productos/${product.slug}"
          ${product.slug === activeSlug ? 'aria-current="page"' : ""}
        >
          <span>${product.number}</span>
          <strong>${product.name}</strong>
          <i aria-hidden="true">↗</i>
        </a>
      `
    )
    .join("");

export const getProductPageHtml = (product) => {
  const whatsappUrl = createWhatsappUrl(product.name);
  const nextProduct = productPages[product.next];

  return `
    <div class="product-page product-page--${product.slug}">
      <header class="product-page-header" aria-label="Navegación del producto">
        <a class="brand-link" href="/" aria-label="Ir al inicio de SYRO">
          <img class="brand-logo" src="/assets/syrologo.png" alt="SYRO logo" />
        </a>
        <nav class="product-page-header__nav" aria-label="Navegación secundaria">
          <a href="/#case-studies">Productos</a>
          <a class="product-page-header__contact" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">
            Contacto <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <main>
        <section class="product-hero" aria-labelledby="product-title">
          <div class="product-hero__grid" aria-hidden="true"></div>
          <div class="product-hero__meta product-intro-item" style="--intro-delay: 0.12s">
            <span>PRODUCTO // ${product.number}</span>
            <span>SYRO · 2026</span>
          </div>

          <div class="product-hero__copy">
            <p class="product-hero__kicker product-intro-item" style="--intro-delay: 0.2s">${product.kicker}</p>
            <h1 id="product-title" class="product-intro-item" style="--intro-delay: 0.28s">${product.name}</h1>
            <p class="product-hero__lead product-intro-item" style="--intro-delay: 0.38s">${product.lead}</p>
            <div class="product-hero__actions product-intro-item" style="--intro-delay: 0.48s">
              <a class="product-button product-button--primary" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">
                Solicitar información <span aria-hidden="true">↗</span>
              </a>
              <a class="product-button product-button--ghost" href="#capacidades">
                Explorar producto <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>

          <figure class="product-hero__visual product-intro-item" style="--intro-delay: 0.34s">
            <img src="${product.image}" alt="${product.imageAlt}" style="object-position: ${product.imagePosition}" />
            <figcaption>
              <span>SYRO / ${product.number}</span>
              <span>República Dominicana</span>
            </figcaption>
          </figure>

          <div class="product-hero__rail product-intro-item" style="--intro-delay: 0.54s" aria-label="Características principales">
            ${product.highlights.map((highlight) => `<span>${highlight}</span>`).join("")}
          </div>
        </section>

        <section class="product-statement product-texture-light">
          <div class="product-section-label" data-product-reveal>
            <span class="product-section-label__mark" aria-hidden="true"></span>
            <span>VISIÓN DEL PRODUCTO</span>
          </div>
          <div class="product-statement__content">
            <h2 data-product-reveal>${product.statement}</h2>
            <p data-product-reveal>${product.description}</p>
          </div>
        </section>

        <section class="product-capabilities product-texture-light" id="capacidades" aria-labelledby="capabilities-title">
          <header class="product-capabilities__header">
            <div class="product-section-label" data-product-reveal>
              <span class="product-section-label__mark" aria-hidden="true"></span>
              <span>CAPACIDADES</span>
            </div>
            <h2 id="capabilities-title" data-product-reveal>Diseñado alrededor de cómo trabaja tu negocio.</h2>
          </header>
          <div class="product-capabilities__grid">
            ${product.capabilities
              .map(
                (capability) => `
                  <article class="product-capability" data-product-reveal>
                    <span class="product-capability__number">${capability.number}</span>
                    <div>
                      <h3>${capability.title}</h3>
                      <p>${capability.copy}</p>
                    </div>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>

        <section class="product-showcase">
          <div class="product-showcase__topline" data-product-reveal>
            <span>UNA EXPERIENCIA SYRO</span>
            <span>${product.number} / 03</span>
          </div>
          <figure class="product-showcase__media" data-product-reveal>
            <img src="${product.image}" alt="" style="object-position: ${product.imagePosition}" />
            <img class="product-showcase__logo" src="${product.logo}" alt="${product.name}" />
          </figure>
          <p class="product-showcase__closing" data-product-reveal>${product.closing}</p>
        </section>

        <section class="product-switcher product-texture-light" aria-labelledby="more-products-title">
          <div class="product-switcher__header">
            <div class="product-section-label" data-product-reveal>
              <span class="product-section-label__mark" aria-hidden="true"></span>
              <span>ECOSISTEMA SYRO</span>
            </div>
            <h2 id="more-products-title" data-product-reveal>Conoce todos nuestros productos.</h2>
          </div>
          <nav class="product-switcher__nav" aria-label="Otros productos" data-product-reveal>
            ${productNavigation(product.slug)}
          </nav>
          <a class="product-switcher__next" href="/productos/${nextProduct.slug}" data-product-reveal>
            <span>Siguiente producto</span>
            <strong>${nextProduct.name}</strong>
            <i aria-hidden="true">→</i>
          </a>
        </section>

        <section class="product-cta">
          <p data-product-reveal>¿Listo para digitalizar tu operación?</p>
          <h2 data-product-reveal>Construyamos la próxima etapa de tu negocio.</h2>
          <a class="product-button product-button--light" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" data-product-reveal>
            Hablar con SYRO <span aria-hidden="true">↗</span>
          </a>
        </section>
      </main>

      <footer class="product-footer">
        <div class="product-footer__brand">
          <img class="brand-logo" src="/assets/syrologo.png" alt="SYRO" />
          <p>Software inteligente para negocios que quieren avanzar.</p>
        </div>
        <nav aria-label="Enlaces del footer">
          <a href="/">Inicio</a>
          <a href="/#case-studies">Productos</a>
          <a href="mailto:info@syrotechdr.com">info@syrotechdr.com</a>
          <a href="tel:+18496586057">+1 (849) 658-6057</a>
        </nav>
        <p class="product-footer__wordmark" aria-label="SYRO">SYRO</p>
      </footer>
    </div>
  `;
};
