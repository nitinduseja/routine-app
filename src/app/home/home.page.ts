import { Component } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  FormControl,
} from '@angular/forms';
import { Storage } from '@capacitor/storage';
import { ActionSheetController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  theme: 'system' | 'light' | 'dark' = 'system';
  themeIcon: string = 'contrast'; // system: contrast, light: sunny, dark: moon
  ngAfterViewInit() {
    this.setTheme(this.theme);
  }

  cycleTheme() {
    if (this.theme === 'system') {
      this.theme = 'light';
    } else if (this.theme === 'light') {
      this.theme = 'dark';
    } else {
      this.theme = 'system';
    }
    this.setTheme(this.theme);
  }

  setTheme(theme: 'system' | 'light' | 'dark') {
    const body = document.body;
    body.classList.remove('dark-theme', 'light-theme');
    if (theme === 'dark') {
      body.classList.add('dark-theme');
      this.themeIcon = 'moon';
    } else if (theme === 'light') {
      body.classList.add('light-theme');
      this.themeIcon = 'sunny';
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        body.classList.add('dark-theme');
      } else {
        body.classList.add('light-theme');
      }
      this.themeIcon = 'contrast';
    }
    // Force Ionic to recalculate theme variables
    document.documentElement.style.setProperty('color-scheme', theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  }
  isModalOpen: boolean = false;
  routineForm: FormGroup;
  tasks: FormArray;
  list: Array<any> = [];
  routineMode: string = 'Add';

  constructor(public formBuilder: FormBuilder, public actionSheetController: ActionSheetController, public toastController: ToastController) {}

  async ngOnInit() {
    this.routineForm = this.getRoutineForm();
    const { value } = await Storage.get({ key: 'routine' });
    this.list = JSON.parse(value) ?? [];
  }

  getRoutineForm() {
    return this.formBuilder.group({
      index: ['', []],
      title: ['', [Validators.required]],
      mode: ['add', []],
      tasks: this.formBuilder.array([this.createTaskFormGroup()]),
    });
  }

  allTasks(): FormArray {
    return this.routineForm.get('tasks') as FormArray;
  }

  addTaskFormGroup() {
    this.allTasks().push(this.createTaskFormGroup());
  }

  removeOrClearTask(i: number) {
    if (this.allTasks().length > 1) {
      this.allTasks().removeAt(i);
    }
  }

  createTaskFormGroup(task = null, isCompleted = false): FormGroup {
    return new FormGroup({
      tasks: new FormControl(task ?? ''),
      completed: new FormControl(isCompleted),
    });
  }

  getControl() {
    return this.routineForm.controls;
  }

  onCloseRoutingModal() {
    this.reset();
  }

  reset() {
    this.isModalOpen = false;
    this.routineForm = this.getRoutineForm();
    this.routineMode = 'Add';
  }

  async submitRoutine() {
    const { mode, index, title, tasks } = this.routineForm.value;
    if(mode == 'edit') {
      this.list[index] = { ...this.list[index], title, tasks };
    }else {
      const id = this.list.reverse()[0] ? this.list.reverse()[0].id : 0;
      this.list.push({ id: id + 1, title, tasks });
    }
    this.addToStorage('routine', this.list);
    this.reset();
    this.presentToast(`Routine ${mode == 'edit' ? 'Updated' : 'Created'} Successfully.`);
  }

  taskAction(listIndex, taskIndex, task, completed) {
    this.list[listIndex].tasks[taskIndex] = { ...this.list[listIndex].tasks[taskIndex], completed };
  }

  editRoutine(index) {
    this.routineMode = 'Edit';
    const routine = this.list[index];

    this.routineForm.patchValue({title: routine.title, mode: 'edit', index});

    this.allTasks().removeAt(0);
    routine.tasks.forEach(element => {
      this.allTasks().push(this.createTaskFormGroup(element.tasks, element.completed))
    });

    this.isModalOpen = true;
  }

  async addToStorage(key, data) {
    await Storage.set({
      key: key,
      value: JSON.stringify(data),
    });
  }

  async deleteRoutine() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Are you sure you want to delete this?',
      cssClass: 'my-custom-class',
      buttons: [{
        text: 'Delete',
        role: 'destructive',
        icon: 'trash',
        id: 'delete-button',
        data: {
          type: 'delete'
        },
        handler: () => {
          const { index } = this.routineForm.value;
          this.list = this.list.filter((e,i) => i != index );
          this.addToStorage('routine', this.list);
          this.reset();
          this.presentToast('Routine Deleted Successfully.');
        }
      },
      {
        text: 'Cancel',
        icon: 'close',
        role: 'cancel',
        handler: () => { }
      }]
    });
    await actionSheet.present();
  }

  async presentToast(message, color = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color
    });
    toast.present();
  }

}
