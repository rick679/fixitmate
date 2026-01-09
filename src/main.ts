import './style.css'

// --- 1. Utilities & Init ---

// Robust Scroll Reveal System
const observerOptions = {
  root: null,
  threshold: 0.15,
  rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
    }
  });
}, observerOptions);

document.querySelectorAll('.reveal').forEach((el) => {
  observer.observe(el);
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (this: HTMLAnchorElement, e) {
    if (this.getAttribute('href')?.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href') || '');
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }
  });
});

// Theme Toggler
const themeBtn = document.getElementById('theme-toggle');
const body = document.body;
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  body.classList.add('light-mode');
}

themeBtn?.addEventListener('click', () => {
  body.classList.toggle('light-mode');
  const isLight = body.classList.contains('light-mode');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
});

// --- 2. Mock Authentication System ---

// Update Header State
function updateAuthUI() {
  const userStr = localStorage.getItem('currentUser');
  const authContainer = document.getElementById('auth-actions');

  if (authContainer && userStr) {
    const user = JSON.parse(userStr);
    authContainer.innerHTML = `
      <div style="display:flex; align-items:center; gap:15px;">
        <span style="font-weight:600; color:var(--text-main);">Hi, ${user.name.split(' ')[0]}</span>
        <a href="/dashboard.html" class="btn btn-primary" style="padding: 6px 12px; font-size: 0.9rem;">Dashboard</a>
        <button id="logout-btn" class="btn btn-outline" style="padding: 6px 12px; font-size: 0.9rem;">Logout</button>
      </div>
    `;

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      window.location.href = '/';
    });
  }
}
updateAuthUI();

// Handle Signup
const signupForm = document.getElementById('signup-form') as HTMLFormElement;
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('fullname') as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passInput = document.getElementById('password') as HTMLInputElement;
    const roleInput = document.querySelector('input[name="role"]:checked') as HTMLInputElement;

    const newUser = {
      name: nameInput.value,
      email: emailInput.value,
      password: passInput.value,
      role: roleInput ? roleInput.id.replace('role-', '') : 'homeowner'
    };

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find((u: any) => u.email === newUser.email)) {
      alert('Account already exists! Please log in.');
      return;
    }

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(newUser));

    alert('Account created successfully!');
    window.location.href = '/dashboard.html';
  });
}

// Handle Login
const loginForm = document.getElementById('login-form') as HTMLFormElement;
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passInput = document.getElementById('password') as HTMLInputElement;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find((u: any) => u.email === emailInput.value && u.password === passInput.value);

    if (foundUser) {
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      window.location.href = '/dashboard.html';
    } else {
      alert('Invalid email or password.');
    }
  });
}

// --- 3. Marketplace Logic (Dashboard) ---

const dashboardContent = document.getElementById('dashboard-content');
if (dashboardContent) {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) {
    window.location.href = '/login.html';
  } else {
    const user = JSON.parse(userStr);
    if (user.role === 'expert') {
      renderExpertDashboard(user);
    } else {
      renderHomeownerDashboard(user);
    }
  }
}

function renderHomeownerDashboard(user: any) {
  const template = document.getElementById('homeowner-view') as HTMLTemplateElement;
  if (!template) return;

  const clone = template.content.cloneNode(true) as DocumentFragment;
  const container = document.getElementById('dashboard-content')!;

  container.innerHTML = '';
  container.appendChild(clone);

  // Toggle Form
  document.getElementById('new-request-btn')?.addEventListener('click', () => {
    document.getElementById('request-form-container')!.style.display = 'block';
    document.getElementById('new-request-btn')!.style.display = 'none';
  });

  document.getElementById('cancel-request-btn')?.addEventListener('click', () => {
    document.getElementById('request-form-container')!.style.display = 'none';
    document.getElementById('new-request-btn')!.style.display = 'block';
  });

  // Handle New Request
  document.getElementById('create-request-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = (document.getElementById('req-title') as HTMLInputElement).value;
    const cat = (document.getElementById('req-category') as HTMLSelectElement).value;
    const desc = (document.getElementById('req-desc') as HTMLTextAreaElement).value;

    const requests = JSON.parse(localStorage.getItem('requests') || '[]');
    const newReq = {
      id: Date.now().toString(),
      homeownerId: user.email,
      homeownerName: user.name,
      title,
      category: cat,
      description: desc,
      status: 'Open',
      date: new Date().toLocaleDateString(),
      offers: []
    };

    requests.unshift(newReq);
    localStorage.setItem('requests', JSON.stringify(requests));

    alert('Request Posted!');
    window.location.reload();
  });

  // Render My Requests
  const list = document.getElementById('my-requests-list')!;
  const allRequests = JSON.parse(localStorage.getItem('requests') || '[]');
  const myRequests = allRequests.filter((r: any) => r.homeownerId === user.email);

  if (myRequests.length === 0) {
    list.innerHTML = '<p class="text-muted">No requests yet. Post one above!</p>';
  } else {
    myRequests.forEach((req: any) => {
      const card = document.createElement('div');
      card.className = 'request-card';
      let offersHtml = '';

      if (req.offers && req.offers.length > 0) {
        offersHtml = `<div class="offer-section"><h4>Received Offers:</h4>`;
        req.offers.forEach((offer: any) => {
          offersHtml += `
             <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:10px; border-top:1px solid var(--border);">
               <div>
                 <strong>${offer.expertName}</strong> says: "${offer.message}"
                 <div style="color:var(--primary); font-weight:bold;">$${offer.price}</div>
               </div>
               ${req.status === 'Open' ? `<button onclick="acceptOffer('${req.id}', '${offer.expertName}')" class="btn btn-primary" style="font-size:0.8rem; padding:4px 8px;">Accept</button>` : ''}
             </div>
           `;
        });
        offersHtml += `</div>`;
      } else {
        offersHtml = `<p style="font-size:0.9rem; color:var(--text-muted); margin-top:1rem;">No offers yet.</p>`;
      }

      card.innerHTML = `
        <div class="request-header">
           <h3 style="margin:0;">${req.title}</h3>
           <span class="badge ${req.status === 'Open' ? 'badge-open' : 'badge-closed'}">${req.status}</span>
        </div>
        <div style="margin-bottom:10px;"><span class="badge badge-category">${req.category}</span> <span style="font-size:0.9rem; color:var(--text-muted);">${req.date}</span></div>
        <p>${req.description}</p>
        ${offersHtml}
      `;
      list.appendChild(card);
    });
  }
}

function renderExpertDashboard(user: any) {
  const template = document.getElementById('expert-view') as HTMLTemplateElement;
  if (!template) return;

  const clone = template.content.cloneNode(true) as DocumentFragment;
  const container = document.getElementById('dashboard-content')!;

  container.innerHTML = '';
  container.appendChild(clone);

  const list = document.getElementById('job-board-list')!;
  const allRequests = JSON.parse(localStorage.getItem('requests') || '[]');
  const openRequests = allRequests.filter((r: any) => r.status === 'Open');

  if (openRequests.length === 0) {
    list.innerHTML = '<p class="text-muted">No open jobs right now. Check back later!</p>';
  } else {
    openRequests.forEach((req: any) => {
      const hasOffered = req.offers && req.offers.some((o: any) => o.expertEmail === user.email);

      const card = document.createElement('div');
      card.className = 'request-card';
      card.innerHTML = `
        <div class="request-header">
           <h3 style="margin:0;">${req.title}</h3>
           <span class="badge badge-category">${req.category}</span>
        </div>
        <p style="margin-bottom:1rem;">${req.description}</p>
        <div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:1rem;">Posted by ${req.homeownerName} on ${req.date}</div>
        
        ${hasOffered
          ? `<button class="btn btn-outline" disabled>Offer Sent</button>`
          : `<form onsubmit="submitOffer(event, '${req.id}', '${user.name}', '${user.email}')" style="display:flex; gap:10px;">
               <input type="number" placeholder="Price ($)" required style="width:100px; padding:8px; border-radius:6px; border:1px solid var(--border);">
               <input type="text" placeholder="Message" required style="flex:1; padding:8px; border-radius:6px; border:1px solid var(--border);">
               <button type="submit" class="btn btn-primary">Send Offer</button>
             </form>`
        }
      `;
      list.appendChild(card);
    });
  }
}

// Global functions for inline HTML event handlers
(window as any).submitOffer = (e: Event, reqId: string, expertName: string, expertEmail: string) => {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const price = (form.querySelector('input[type="number"]') as HTMLInputElement).value;
  const msg = (form.querySelector('input[type="text"]') as HTMLInputElement).value;

  const requests = JSON.parse(localStorage.getItem('requests') || '[]');
  const reqIndex = requests.findIndex((r: any) => r.id === reqId);

  if (reqIndex > -1) {
    if (!requests[reqIndex].offers) requests[reqIndex].offers = [];
    requests[reqIndex].offers.push({
      expertName,
      expertEmail,
      price,
      message: msg
    });
    localStorage.setItem('requests', JSON.stringify(requests));
    alert('Offer Sent!');
    window.location.reload();
  }
};

(window as any).acceptOffer = (reqId: string, expertName: string) => {
  if (!confirm(`Accept offer from ${expertName}?`)) return;

  const requests = JSON.parse(localStorage.getItem('requests') || '[]');
  const reqIndex = requests.findIndex((r: any) => r.id === reqId);

  if (reqIndex > -1) {
    requests[reqIndex].status = 'Closed';
    localStorage.setItem('requests', JSON.stringify(requests));
    alert('Offer Accepted! The expert has been notified.');
    window.location.reload();
  }
};
