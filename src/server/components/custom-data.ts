import Component from '../component';

export default class CustomData extends Component {
  public custom_data;

  constructor(custom_data) {
    super();

    this.custom_data = custom_data;
  }
}