import * as Yup from 'yup';
import Appointment from '../models/Appointment';
import User from '../models/User';

class AppointmentController {
  // eslint-disable-next-line class-methods-use-this
  async store(req, res) {
    const schema = Yup.object().shape({
      provide_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validate fails' });
    }

    // Check provider is a provider

    const { provide_id, date } = req.body;

    const isProvider = await User.findOne({
      where: { id: provide_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'You can only create appointment with providers' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provide_id,
      date,
    });

    return res.json(appointment);
  }
}
export default new AppointmentController();
