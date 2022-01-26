// Code goes here
// autobind decorator
function AutoBind(_: any, _1: string | Symbol, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  const adjustedDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFunction = originalMethod.bind(this);
      return boundFunction;
    }
  }

  return adjustedDescriptor;
}

// enum
enum ProjectStatus { Active, Finished }

// Project Type
class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {

  }
}

type Listener = (items: Project[]) => void;

// PROJECT STATE MANAGEMENT
class ProjectState {
  private listeners: Listener[] = [];
  private projects: Project[] = [];
  private static instance: ProjectState;

  private constructor() {}

  static getInstance() {
    if (this.instance) return this.instance;
    this.instance = new ProjectState();
    return this.instance;
  }

  addProject(title: string, description: string, numberOfPeople: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      numberOfPeople,
      ProjectStatus.Active
    );

    this.projects.push(newProject);

    for (const listenerFn of this.listeners) {
      listenerFn(this.projects.slice())
    }
  }

  addListener(listenerFn: Listener) {
    this.listeners.push(listenerFn);
  }
}

const projectState = ProjectState.getInstance();

// validator
interface ValidatorConfig {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

function validate(validateInput: ValidatorConfig) {
  let isValid = true;

  if (validateInput.required) {
    isValid = isValid && validateInput.value.toString().trim().length !== 0;
  }
  if (validateInput.minLength != null && typeof validateInput.value === 'string') {
    isValid = isValid && validateInput.value.length >= validateInput.minLength;
  }
  if (validateInput.maxLength != null && typeof validateInput.value === 'string') {
    isValid = isValid && validateInput.value.length <= validateInput.maxLength;
  }
  if (validateInput.min != null && typeof validateInput.value === 'number') {
    isValid = isValid && validateInput.value >= validateInput.min
  }
  if (validateInput.max != null && typeof validateInput.value === 'number') {
    isValid = isValid && validateInput.value <= validateInput.max
  }

  return isValid;
}



// Project list class
class ProjectList {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element : HTMLElement;
  assginedProjects: Project[] = []

  constructor(private type: 'active' | 'finished') {
    this.templateElement = <HTMLTemplateElement>document.getElementById('project-list')!
    this.hostElement = <HTMLDivElement>document.getElementById('app')!

    const importedHtmlNode = document.importNode(this.templateElement.content, true);
    this.element = <HTMLElement>importedHtmlNode.firstElementChild;
    this.element.id = `${this.type}-projects`

    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter(project => {
        if (this.type === 'active') {
            return project.status === ProjectStatus.Active
        }
        return project.status === ProjectStatus.Finished;

      })
      this.assginedProjects = relevantProjects;
      this.renderProjectsList();
    })

    this.attachElement();
    this.renderListContent();
  }

  private renderProjectsList() {
    const listElement = <HTMLUListElement>document.getElementById(`${this.type}-projects-list`)!;
    listElement.innerHTML = '';

    for (const projectItem of this.assginedProjects) {
      const listItem = document.createElement('li');
      listItem.textContent = projectItem.title;
      listElement.appendChild(listItem)
    }
  }

  private renderListContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector('ul')!.id = listId;
    this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + " PROJECTS";
  }

  private attachElement() {
    this.hostElement.insertAdjacentElement('beforeend', this.element);
  }
}

// Project Input class
class ProjectInput {
  templateElement: HTMLTemplateElement;
  hostElememt: HTMLDivElement;
  element : HTMLFormElement;
  titleInputElement: HTMLInputElement;
  descriptionElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    this.templateElement = <HTMLTemplateElement>document.getElementById('project-input')!;
    this.hostElememt = <HTMLDivElement>document.getElementById('app')!;

    const importedHtmlNode = document.importNode(this.templateElement.content, true);
    this.element = <HTMLFormElement>importedHtmlNode.firstElementChild;
    this.element.id = 'user-input';

    this.titleInputElement = <HTMLInputElement>this.element.querySelector('#title');
    this.descriptionElement = <HTMLInputElement>this.element.querySelector('#description');
    this.peopleInputElement = <HTMLInputElement>this.element.querySelector('#people');

    this.configure();
    this.attachElement();
  }

  private gatherUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInputElement.value;
    const enteredDescription = this.descriptionElement.value;
    const enteredPeople = this.peopleInputElement.value;

    const titleValidatable: ValidatorConfig = {
      value: enteredTitle,
      required: true
    }

    const enteredDescriptionValidatable: ValidatorConfig = {
      value: enteredDescription,
      required: true,
      minLength: 5
    }

    const enteredPeopleValidatable: ValidatorConfig = {
      value: enteredTitle,
      required: true,
      min: 1,
      max: 5
    }

    if (
      !validate(titleValidatable) ||
      !validate(enteredDescriptionValidatable) ||
      !validate(enteredPeopleValidatable)
    ) {
      alert('Invalid input value');
      return;
    } else {
      return [enteredTitle, enteredDescription, +enteredPeople];
    }
  }

  private clearInput() {
    this.titleInputElement.value = '';
    this.descriptionElement.value = '';
    this.peopleInputElement.value = '';
  }

  @AutoBind
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput();

    if (Array.isArray(userInput)) {
      const [title, description, people] = userInput;

      // console.log(title, description, people);
      projectState.addProject(title, description, people);
      this.clearInput();
    }
  }

  private attachElement() {
    this.hostElememt.insertAdjacentElement('afterbegin', this.element)
  }

  private configure() {
    this.element.addEventListener('submit', this.submitHandler);
  }
}

const projectInputElement = new ProjectInput();
const activeProjectList = new ProjectList('active');
const finishedProjectList = new ProjectList('finished');
